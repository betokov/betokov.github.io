import './util/beforeStart.js'
import './impression';
import $ from 'jquery';
import { runWithPriority } from "./plugin/face/runVendorsWithPriority";
import {
    gaEvent,
    gaUserId,
    gaPush,
    gaPushObject,
    getCategoryPrefix,
    updatePhoneTypeActions,
    gaSkipEmailOptin
} from './util/ga';
import { isAndroid, isAppleDevice, isNoCameraStream, detectDeviceScreen } from './util/device';
import Factory from './field/factory';
import { getSafeOptions } from "./util/safeOptions";
import { initWidgets } from './widget/widgets';
import Context from './context/Context';
import Timer from './context/Timer';
import { ubeHostFallBack, ubeHostAdd } from './util/fallback';
import { isNoPreload } from './config/form';
import { validateSetCaptchaProof, initFormCaptchaV3, captchaV3Domains, initFormCaptcha } from './util/captcha';
import { ubeCookie, cookies, getGA4UserId, getGA4SessionId, sessionExpiration, ubeSession } from './util/cookie';
import { acceptTerms } from './util/terms';
import { setPassword } from './util/setPassword';
import { toggleLoader } from './util/toggleLoader';
import { oneTrustInit } from './util/oneTrust';
import Fingerprint from "./fingerprint/Fingerprint";
import Device from "./device/Device";
import { faceErrors, errorMap } from './util/faceTexts'
import { getImageSize, imageDataToBlob, logACSResultToELK, resizeImage } from './util/faceHelpers.js';
import { getKeyFromUrl, getQueryParameter, isMbepDomain, isP1Domain, isQRDomain } from "./util/url";
import {actionPathReg} from "./config/actionPath";
import {pluralize} from "./util/numberHelpers";

var debug = false;

function log(m) {
    if (debug) console.log(m);
};

var handleAjaxFail = function (jqxhr, textStatus, error) {
    console.log("Request Failed: " + textStatus + ", " + error);
};

var capitalize = function (string) {
    return ("" + string).charAt(0).toUpperCase() + string.slice(1);
};

var captchaV3Initialized = false;
let safeOptionData;

var fingerPrint = new Fingerprint();
var device = new Device();

fingerPrint.calculateAudioFingerprint();
fingerPrint.calculateCanvasBase64();
fingerPrint.calculateFontFingerprint();

device.calculateDeviceResolution();
device.calculateDeviceModel();
device.calculateDeviceTimezone();

var handleLogin = function (sessionKey, redirectUrl, data) {
    const { kind, label, socialKey, requireConsent = false, entity, termsCode = [], enterPassword = false, userId } = data;
    const apiUrl = $.ube.host + "/api";
    const isSocialLogin = kind === 'socialLogin';
    const action = isSocialLogin ? `form - social - ${socialKey}` : 'Success';
    const gaLabel = !isSocialLogin ? (label || kind) : undefined;

    if ($.ube && $.ube.login) {
        gaPush(isSocialLogin ? "dl_auth_social_success" : "dl_auth_success", action, gaLabel);       

        if (enterPassword && typeof $.ube.enterPassword === "function") {
            return $.ube.enterPassword(sessionKey, function (newPassword) {
                return setPassword(sessionKey, entity, newPassword, apiUrl);
            }, userId).then(function (respond) {
                const buff = {
                    ...data,
                    enterPassword: false
                };

                return handleLogin(sessionKey, redirectUrl, buff);
            }).catch(function (err) {
                console.log('Error while setting password', err);
            });
        }

        if (enterPassword && typeof $.ube.enterPassword !== "function") {
            const buff = {
                ...data,
                enterPassword: false
            };

            return handleLogin(sessionKey, redirectUrl, buff);
        }

        if (requireConsent && typeof $.ube.showTermsPopup === "function") {
            return $.ube.showTermsPopup(sessionKey, termsCode, function () {
                return acceptTerms(sessionKey, entity, termsCode, apiUrl);
            }, userId).then(function (respond) {
                const buff = {
                    ...data,
                    requireConsent: false
                };

                return handleLogin(sessionKey, redirectUrl, buff);
            }).catch(function (err) {
                console.log('Error while terms popup', err);
            });
        }

        return $.ube.login(sessionKey, redirectUrl, kind);
    } else {
        console.error("Implement $.ube.login function to handle social login and hash login")
    }
};

var handleSocialLoginResult = function (result, entity) {
    if (result && result.sessionKey) {
        handleLogin(result.sessionKey, result.redirectUrl, {
            kind: result.kind,
            socialKey: result.socialKey,
            requireConsent: result.data.requireConsent,
            entity,
            termsCode: result.data.termsCode
        });
    } else {
        if (result.socialId) {
            gaPush("dl_auth_social_proccess", "get_data - form - social - " + result.socialKey);
            setSocialIdCookie(result.socialId, result.socialKey, result.data);
        }

        if (result.registrationUrl) {
            gaPush("dl_auth_social_fail", "form - social - " + result.socialKey + " - reason: Redirect-Registration");
            window.location.href = result.registrationUrl
        } else if (result.message) {
            gaPush("dl_auth_social_fail", "view - pop_up_fail_social - " + result.socialKey);
            $.ube.showPopup(result.message);
            if ($.ube && $.ube.loginFail) $.ube.loginFail();
        }
    }
};

var ubeOauth = function (key, sessionKey, name, api_url, callback, finalRedirectUrl) {

    var popup = window.location.protocol + "//" + window.location.hostname;
    if (window.location.port && window.location.port !== "") popup = popup + ":" + window.location.port;
    popup = popup + "/";

    var initialWindowPath = popup;

    var width = Math.min(Math.max($(window).width() - 300, 800), 1200);

    var windowOptions = "location=0,status=0,width=" + width + ",height=650";

    var oauthWindow = window.open(initialWindowPath, "PMSM авторизация " + key, windowOptions);

    $.ajax({
        url: api_url + "/auth/" + name + "/" + key + "/url",
        headers: {
            "Authorization": "Bearer " + sessionKey
        }
    }).done(function (data) {
        oauthWindow.location.href = data.authorizationUrl;

        var oauthInterval = window.setInterval(function () {
            if (oauthWindow.closed) {
                window.clearInterval(oauthInterval);
            }
            if (oauthWindow.location.href.indexOf("code=") > -1) {
                window.clearInterval(oauthInterval);


                if (finalRedirectUrl) oauthWindow.location.href = finalRedirectUrl;
                else oauthWindow.close();
                var code = oauthWindow.location.href.split("code=")[1].split("&")[0];

                if (code && code !== "") {
                    $.ajax({
                        url: api_url + "/auth/" + name + "/" + key + "/callback",
                        headers: {
                            "Authorization": "Bearer " + sessionKey
                        },
                        data: { code }
                    }).done(function (result) {
                            if (result.data) {
                                var value;
                                if (key === "vk") {
                                    value = result.data.user_id;
                                } else if (key === "instagram") {
                                    value = result.data.instagram;
                                } else {
                                    value = result.data.user_id || result.data.userId || result.data.socialId || result.data.id;
                                }
                                callback(value, result);
                            }
                        })
                        .fail(function () {
                            console.log("UBE :: Social code check submission ERROR");
                            console.log(xhr, resp, text);
                        })
                }

            }
        }, 300);

    });
};

var _COOKIE_POLICY = cookies.UBE_COOKIE_POLICY;
var _COOKIE_CHECK = cookies.UBE_COOKIE_CHECK;

var autoAddSessionFields = ["socialId", "socialKey", "email", "firstName", "lastName", "phone", "gender", "birthDate", "instagram", "vkontakte", "facebook", "telegram", "viber", "utmCampaign", "utmContent", "utmSource", "utmMedium", "utmMedia"];

var setSocialIdCookie = function (socialId, socialKey, result) {

    autoAddSessionFields.forEach(function (key) {
        if (result[key]) ubeSession(key, result[key])
    });

    ubeSession("socialId", socialId);
    ubeSession("socialKey", socialKey);

};

var clearSessionFields = function () {
    autoAddSessionFields.forEach(function (key) {
        ubeSession(key, null);
    });
};

$.ubeCookie = ubeCookie;

window.ubeCookie = $.ubeCookie;

$.ubeLoginTelegram = function (entity, user) {

    $.get($.ube.host + "/api/auth/" + entity + "/telegram/callback", user)
        .done(function (result) {
            toggleLoader(false);
            if (result && result.sessionKey) {
                handleLogin(result.sessionKey, result.redirectUrl, { kind: "telegram" });
            } else {

                if (result.socialId)
                    setSocialIdCookie(user.id, "telegram", result.data);
                if (result.registrationUrl) {
                    window.location.href = result.registrationUrl;
                } else if (result.message)
                    $.ube.showPopup(result.message);
            }
        })
        .fail(function () {
            toggleLoader(false);
            console.log("UBE :: Social code check submission ERROR");
            console.log(xhr, resp, text);
        })

};

window.ubeLoginTelegram = $.ubeLoginTelegram;

$.fn.ubeCabinet = function (url, _sessionKey, opts) {
    var container = $(this);
    var sessionKey = _sessionKey;
    var updatedUrl = url.replace("/main/", "/form/");
    function initializeUbeForm(container) {
        return function (data, definition) {
            var options = opts || {};
            options.data = $.extend({}, data, (opts || {}).data || {});
            options.sessionKey = sessionKey;
            options.loadFormDataFromSession = false;
            options.formDefinitionJson = definition;
            options.isTemplatePreloaded = true;
            if (data.error) {
                if (options.onSessionError) options.onSessionError(data.error, sessionKey);
            }
            else container.ube(updatedUrl, options);
        }
    }
    ubeCookie(cookies.UBE_SESSION_KEY, sessionKey, sessionExpiration());

    var requestUrl = url.replace(/\/main\/(.[^/]+)-cabinet/, "/esb/$1-cabinet/cabinet");
    if (debug) requestUrl = requestUrl.replace("https://ube-test.pmsm.org.ru", "http://localhost:8080");
    if (opts && opts.data && opts.data.userId) requestUrl = requestUrl + "?userId=" + opts.data.userId;

    var closeLoaderOnFail = function () {
        toggleLoader(true);
    };

    toggleLoader(true);

    var loadedFormData, loadedFormDefinition = false;
    var isTemplateLoaded = opts && opts.isTemplatePreloaded;

    var checkIfAllLoaded = function () {
        if (loadedFormData && loadedFormDefinition) {
            toggleLoader(false);
            initializeUbeForm(container)(loadedFormData, loadedFormDefinition);
        }
    };

    var formDefinitionPromise = $.getJSON(updatedUrl).fail(handleAjaxFail).fail(closeLoaderOnFail);
    var formDataPromise = $.ajax({
        url: requestUrl,
        headers: {"ube-session-key": sessionKey},
        success: function (_loadedFormData, status, xhr) {
            loadedFormData = _loadedFormData;
            var headerSessionKey = xhr.getResponseHeader('UBE_SESSION_KEY') || xhr.getResponseHeader('ube-session-key');
            if (headerSessionKey && headerSessionKey !== "") {
                console.log("Set session key");
                console.log(headerSessionKey);
                sessionKey = headerSessionKey;
                ubeCookie(cookies.UBE_SESSION_KEY, headerSessionKey, sessionExpiration());
            }
            checkIfAllLoaded();
        },
        error: function (xhr, resp, text) {
            toggleLoader(false);
            $.ube && $.ube.showPopup("Ошибка загрузки данных в форму:" + text);
            console.log("UBE :: User data load error");
            console.log(xhr, resp, text);
        }
    }).fail(handleAjaxFail).fail(closeLoaderOnFail);

    formDefinitionPromise.done(function (_loadedFormDefinition) {
        loadedFormDefinition = _loadedFormDefinition;
        if (!isTemplateLoaded && (!(/(retail)/.test(updatedUrl)) || container.is(':empty')))
            container.html(_loadedFormDefinition.template);
        isTemplateLoaded = true;
        checkIfAllLoaded();
    });

    checkIfAllLoaded();
};

$.fn.ubeAV = function (url, sessionKey, opts) {
    var container = $(this);
    var options = opts || {};
    var entity = url.replace(/.*\//, "");
    var updatedUrl = url.replace("/main/", "/form/").replace("-reg", "-av");
    options.sessionKey = sessionKey;
    options.template = url.replace("/main/", "/form/").replace("-reg", "-av");
    if (!options.data) options.data = {};
    options.data.entity = entity;
    container.ube(updatedUrl, options);
};

$.fn.ubeNext = function () {
    $(this).trigger("ubeNext");
};

$.fn.ubePrev = function () {
    $(this).trigger("ubePrev");
};

/**
 *
 * @param {string} url
 * @param {{transformPayload?: function, actionPathReg?: function, sessionKey?: string, loadFormDataFromSession?: boolean, template?: string, data?: object, setFieldValid?: function}} [options]
 * @returns {$}
 */
$.fn.ube = function (url, options) {
    options = options || {};
    var gaFieldSet = {};
    var sessionKey = options.sessionKey;
    const configKey = getKeyFromUrl(url?.data?.template || url);

    Impression.runImpression(configKey);

    if(!sessionKey && ubeCookie(cookies.UBE_SESSION_KEY_REG) && url && (typeof url === 'string' || url instanceof String) && url.endsWith("-reg")) sessionKey = ubeCookie(cookies.UBE_SESSION_KEY_REG);

    url = ubeHostAdd(url);

    function setVariablesFromSource(src) {
        if (src && src.data && src.data.form) {
            options.loadFormDataFromSession = false;
            var d = src.data;
            options.template = d.template || options.template;
            options.data = d.data || options.data;
            url = d.form;
            sessionKey = d.sessionKey;
        }
    }

    setVariablesFromSource(url);

    // URL attributes to json
    var search = location.search.substring(1) || "";

    var query = search.split("&").reduce(function (prev, curr) {
        var splitted = curr.split("=");
        if (splitted.length === 1) prev[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[0]);
        if (splitted.length > 1) prev[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[1]);
        return prev;
    }, {});

    var events = {};
    for (var attrname in $.ube) {
        options[attrname] = $.ube[attrname];
    }
    var container = $(this).first();
    var host = url.replace(/^((http|https)?:\/\/[^\/]+)(\/.*)?$/, "$1");

    //Enable to test localhost
    if (debug) host = "http://localhost:8080";

    var api_url = host + '/api';
    var getSessionUrl = api_url + "/session/get";
    options.data = options.data || {};
    var initialValues = {};

    function flattenComponents(components, parent) {
        var buffer = [];
        components.forEach(function (c) {

            if (parent) {
                if (parent.conditional && parent.conditional.when && (!c.conditional || !c.conditional.when))
                    c.conditional = parent.conditional;
                if (parent.customConditional && parent.customConditional.length > 0 && (!c.customConditional || c.customConditional.length == 0))
                    c.customConditional = parent.customConditional;
            }

            buffer.push(c);

            if (c.components) {
                buffer = buffer.concat(flattenComponents(c.components, c));
            }
            if (c.columns) {
                c.columns.forEach(function (x) {
                    if (x.components) buffer = buffer.concat(flattenComponents(x.components, c));
                });
            }


        });
        return buffer;
    }

    async function initializeFormByConfig(json) {
        var name = json.path;
        var isWizard = json.display == "wizard";
        var isLeadForm = json.display == "leadForm";
        var formProperties = json.properties || {};
        var captchaType = formProperties.captchaType || 'google';
        var captchaBypass = json.captchaBypass;
        var components = flattenComponents(json.components);
        var validationState = {};
        const isQRForm = isQRDomain();
        const isMBEPForm = isMbepDomain() && !window.location.host.includes('qr');
        const categoryPrefix = getCategoryPrefix();
        let remainingAttemptsCount, phoneConfirmationType;
        const configFromSession = JSON.parse(ubeSession(`${configKey}_config`));

        if(safeOptionData) {
            options.config = safeOptionData;
        } else if (!safeOptionData && configFromSession) {
            options.config = configFromSession;
            safeOptionData = configFromSession;
        } else {
            const res = await getSafeOptions(configKey);
            options.config = res?.config;
            safeOptionData = res?.config;
        }

        if (formProperties.promoCampaignName) {
            sessionStorage.setItem('promoCampaignName', formProperties.promoCampaignName)
        }

        /**
         * Все методы работы с полями переносятся в field/Factory
         * @type {Factory}
         */
        const factory = new Factory(container, components, options);
        const { fieldMap, fieldNames, hasField, getField, setFieldValue, fieldNamesByTag } = factory;
        const getFieldValue = key => factory.getFieldValue(key, initialValues[key]);

        function resetOptinAfterSubmission() {
            ['email', 'phone', 'personalCode'].forEach(function(key) {
                if(hasField(key) && hasField(key + "ValidatedValue")) {
                    setFieldValue(key + "CodeSent", false);
                    setFieldValue(key + "ValidatedValue", "");
                    setFieldValue(key + "CodeSentAt", null);
                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                    resetFieldValidation("submitted" + capitalize(key) + "Code");
                    handleFormVisibility();
                }
            })
        }

        const context = new Context();

        function fieldNamesByPart(part) {
            if (!part || part == "") return fieldNames;
            var panels = json.components.filter(function (c) {
                return c['type'] == "panel"
            });
            var buffer = [];
            var found = false;
            panels.forEach(function (panel) {
                if (panel.key === part) {
                    found = true;
                    flattenComponents(panel.components || [], panel).forEach(function (component) {
                        buffer.push(component.key);
                    });
                }
            });
            if (!found) console.error("Form part subbmitted, but no panel in config: " + part);
            return buffer;
        }

        var appendChildrenKeys = function (key) {
            var component = fieldMap[key];
            if (!component) return console.error("UBE :: Error component not found: " + key);
            return flattenComponents([component]).map(function (x) {
                return x.key;
            });
        };

        console.log("UBE Form Loaded: " + name);

        if(!window.ubeHashInit) {
            checkHash(json, name);
            window.ubeHashInit = true;
        }

        function checkHash(json, name) {
            name = name || null;
            var search = location.search.substring(1) || "";
            var query = getJsonFromUrl();

            if (!query.hash && query["T"]) query.hash = query["T"];
            if (!query.hash && query["hid"]) query.hash = query["hid"];

            var redirect = query["redirectTo"] || query["redirect"];
            var utm_campaign = query["utm_campaign"];
            var utm_source = query["utm_source"];
            var utm_medium = query["utm_medium"];
            var utm_content = query["utm_content"];
            var utm_term = query["utm_term"];

            if (query && query.hash && query.hash != "") {
                toggleLoader(true);
                ubeHostFallBack();

                var url = $.ube.host + "/api/session/resolveHash?hash=" + query.hash + "&entity=" + name + "&source=" + window.location.hostname + "&ymid=" + ubeCookie('_ym_uid') || "";

                if(redirect) {
                    url = url + "&redirect=" + encodeURIComponent(redirect)
                }
                if(utm_campaign) {
                    url = url + "&utm_campaign=" + encodeURIComponent(utm_campaign)
                }
                if(utm_source) {
                    url = url + "&utm_source=" + encodeURIComponent(utm_source)
                }
                if(utm_medium) {
                    url = url + "&utm_medium=" + encodeURIComponent(utm_medium)
                }
                if(utm_content) {
                    url = url + "&utm_content=" + encodeURIComponent(utm_content)
                }
                if(utm_term) {
                    url = url + "&utm_term=" + encodeURIComponent(utm_term)
                }

                $.get(url)
                    .always(function () {
                        toggleLoader(false)
                    })
                    .done(function (data) {
                        if (!redirect || redirect == "") redirect = data.redirectUrl;
                        if (!verifyRedirectSameDomain(redirect)) {
                            redirect = window.location.protocol + "//" + window.location.host;
                            console.error("UBE Redirect URL domain differs from website domain");
                        } else redirect = $.ube.host + redirect

                        try {
                            var rawURL = new URL(redirect);
                            var searchParams = rawURL.searchParams;

                            if(utm_campaign) {
                                searchParams.set('utm_campaign', utm_campaign)
                            }
                            if(utm_source) {
                                searchParams.set('utm_source', utm_source)
                            }
                            if(utm_medium) {
                                searchParams.set('utm_medium', utm_medium)
                            }
                            if(utm_term) {
                                searchParams.set('utm_term', utm_term)
                            }
                            if(utm_content) {
                                searchParams.set('utm_content', utm_content)
                            }

                            rawURL.search = searchParams.toString();
                            redirect = rawURL.pathname + rawURL.search;
                        } catch (e) {}

                        if ($.ube.login && data && data.sessionKey) {
                            handleLogin(data.sessionKey, redirect, {
                                kind: data.kind,
                                requireConsent: data.requireConsent || false,
                                entity: json.path,
                                termsCode: data.termsCode || [],
                                enterPassword: data.enterPassword,
                                userId: data.userId
                            });
                        } else if ($.ube.loginFail && data && !data.sessionKey) {
                            $.ube.loginFail(data);
                        }
                    });
            } else if (query.socialKey && query.code) {
                toggleLoader(true);
                ubeHostFallBack();

                $.ajax({
                    url: $.ube.host + "/api/auth/" + query.entity + "/" + query.socialKey + "/callback",
                    data: { code: query.code },
                    headers: {
                        "Authorization": "Bearer " + sessionKey
                    }
                }).done(function (result) {
                        toggleLoader(false);
                        handleSocialLoginResult(result, query.entity);
                    })
                    .fail(function () {
                        toggleLoader(false);
                        console.log("UBE :: Social code check submission ERROR");
                        gaPush('dl_auth_social_fail', 'view - pop_up_fail_social - ' + query.socialKey);
                        console.log(xhr, resp, text);
                        if ($.ube.loginFail) $.ube.loginFail();
                    })
            } else if ($.ube && $.ube.loginAbsent) {
                $.ube.loginAbsent();
            }
        }

        function ajaxLookupGender(firstName, lastName, handler) {
            $.ajax({
                url: api_url + "/lookup/gender?query=" + encodeURIComponent(firstName + " " + lastName),
                success: function (t) {
                    handler(t.result);
                }
            });
        }

        var wto;
        var handleChange = function () {
            if (wto) clearTimeout(wto);
            wto = setTimeout(function () {
                handler();
            }, 300);
        }

        var previousLookupResult = "";

        function autolookupGender() {

            if(container.find("[name=gender]").hasClass("noAutolookup") || name.includes("-cabinet")) return;

            if (wto) clearTimeout(wto);
            wto = setTimeout(function () {
                var data = getFormData() || {};
                if ((!data.firstName || data.firstName === "") ||
                    (!data.lastName || data.lastName === "")) return;
                ajaxLookupGender(data.firstName, data.lastName, function (result) {
                    if (previousLookupResult !== result && result === "male" || result === "female") {
                        previousLookupResult = result;
                        setFieldValue("gender", result);
                    }
                })
            }, 300);
        }

        function resetFieldValidation(key) {
            container.find(".ube-validation-set-class-" + key).each(function () {
                $(this)
                    .removeClass($(this).attr('data-ube-validation-success-class') || "ube-validation-success")
                    .removeClass($(this).attr('data-ube-validation-class') || "ube-validation-error");
            });
            container.find(".ube-validation-message-for-" + key).empty();
            container.find(".ube-validation-message-show-for-" + key).hide();
        }

        function setFieldValid(key, value) {
            var common = function (key, value) {
                var field = container.find("input[name='" + key + "']");
                container.find(".ube-validation-set-class-" + key).each(function () {
                    $(this)
                        .addClass($(this).attr('data-ube-validation-success-class') || "ube-validation-success")
                        .removeClass($(this).attr('data-ube-validation-class') || "ube-validation-error");
                });
                container.find(".ube-validation-message-for-" + key).html("");
                container.find(".ube-validation-message-show-for-" + key).hide();
                if (key == "firstName" || key == "lastName") autolookupGender();
            }
            var custom = options.setFieldValid;
            if (key && value && value != "" && !gaFieldSet[key]) {
                var field = getField(key);
                if (field && field.is(':visible')) {
                    gaFieldSet[key] = true;
                    //gaPush("Registration", "Fill-" + key, value);
                }
            }
            (custom || common)(key, value, common)
        }

        function setFieldInvalid(key, value, description) {
            var common = function (key, value, description) {
                container.find(".ube-validation-set-class-" + key).each(function () {
                    $(this)
                        .removeClass($(this).attr('data-ube-validation-success-class') || "ube-validation-success")
                        .addClass($(this).attr('data-ube-validation-class') || "ube-validation-error");
                });
                container.find(".ube-validation-message-for-" + key).html(description);
                container.find(".ube-validation-message-show-for-" + key).show();
            }
            var custom = options.setFieldInvalid;

            if (key && gaFieldSet[key] !== false) {
                var forbbidenKeys = ['password'];
                var field = getField(key);
                const preferredMethod = ubeSession('preferredMethod');

                if (/-phone-send$/.test(name)) {
                    const category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                    const phoneTypeActions = {
                        telegram: `number - form - phone_telegram_push - reason: ${description}`,
                        sms: `number - form - phone_sms_code - reason: ${description}`,
                        flashingCall: `number - form - phone_call_code - reason: ${description}`
                    }
                    let action;

                    if(isMBEPForm && !isP1Domain()) {
                        action = `form - phone_number - reason: ${description}`;
                    } else if (preferredMethod) {
                        action = phoneTypeActions[preferredMethod];
                    } else if (phoneConfirmationType) {
                        action = phoneTypeActions[phoneConfirmationType];
                    }

                    gaPush(category, action);
                }
                else if (/-phone-check$/.test(name)) {
                    const category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                    const phoneTypeActions = {
                        telegram: 'telegram_push - form - phone_telegram_push',
                        sms: 'sms_code - form - phone_sms_code',
                        flashingCall: 'call_code - form - phone_call_code'
                    }
                    let action;

                    if(remainingAttemptsCount) {
                        updatePhoneTypeActions(phoneTypeActions, ` - attempts_left: ${remainingAttemptsCount} - reason: ${description}`);
                    } else {
                        updatePhoneTypeActions(phoneTypeActions, ` - reason: ${description}`);
                    }

                    if (isMBEPForm && !isP1Domain()) {
                        action = `form - phone_code - reason: ${description}`;
                    } else if (preferredMethod) {
                        action = phoneTypeActions[preferredMethod];
                    } else if (phoneConfirmationType) {
                        action = phoneTypeActions[phoneConfirmationType];
                    }

                    gaPush(category, action);
                }
                else if (/-reg$/.test(name)) {
                    const category = isQRForm ? 'dl_qr_registration_fail' : 'dl_auth_registration_fail';
                    if (isMBEPForm && $('.reg-form_step_0').is(':visible')) {
                        gaPush('dl_av_idx_registration_fail', `form - idx_reg - ${key} - reason: ${description}`);
                    } else {
                        gaPush(category, `form - registration - ${key} - reason: ${description}`);
                    }
                }
                else if (/-optin$/.test(name)) {
                    gaPush(categoryPrefix + '2optin_fail', `form - 2optin - reason: ${description}`);
                }
                else if (/-idx$/.test(name)) {
                    gaPush(categoryPrefix + 'av_idx_registration_fail', `form - idx_reg - ${key} - reason: ${description}`);
                }
                else if (/remind/.test(name)) {
                    gaPush(categoryPrefix + "auth_resetPassword_fail", `form - resetPassword - reason: ${description}`);
                } 
                else if (/-login$/.test(name)) {
                    gaPush(categoryPrefix + "auth_password_fail", `form - password - reason: ${description}`)
                }

            }

            (custom || common)(key, value, description, common);
        }

        /**
         *
         * @param {string[]} keys
         * @param {string[]} tags
         * @param {function} [handleAllValid]
         * @param {function} [handleSomeInvalid]
         */
        function validateComponents(keys, tags, handleAllValid, handleSomeInvalid) {
            const keysByTags = tags.map(tag => fieldNamesByTag(tag) || []).flat();
            const allKeys = [...new Set( keysByTags.concat(keys || []) )].filter(hasField);

            const result = {};

            console.log("Validation multiple keys: " + keys.join(", ") + " and tags: " + tags.join(", "));

            function checkResult() {
                console.log("Check results: " + allKeys.map(key => key + ": "+result[key]).join(", "));
                if(allKeys.every(key => result[key] === true)) {
                    console.log("All valid");
                    handleAllValid && handleAllValid(allKeys);
                }
                else if(allKeys.every(key => result[key] === true || result[key] === false)) {
                    console.log("Some invalid");
                    handleSomeInvalid && handleSomeInvalid(allKeys.filter(key => !result[key]), allKeys.filter(key => result[key]))
                }
            }

            allKeys.forEach(key => validateComponent(key, validKey => {
                result[validKey] = true;
                checkResult();
            }, invalidKey => {
                result[invalidKey] = false;
                checkResult();
            }))
        }

        function validateComponent(key, handleValid, handleInvalid, onlyToValid, event) {
            var value = getFieldValue(key);
            var isValidationCallbackEvent = event === 'blur' && ($('input[name="' + key + '"]').length > 0 && $('input[name="' + key + '"]').attr('type') !== 'hidden');
            $.fn.clearFieldIfNotFromList = function () {
                const item = $(this).data('data-object');
                const label = $(this).val();

                if ((!item && label && label !== "") || (item && item.label !== label)) {
                    if (label && $(this).data("source") && $(this).data("source").find(x => x && x.label === label)) {
                        $(this).data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: $(this).data("source").find(x => x && x.label === label)});
                    }
                    else {
                        $(this).attr('data-value', null).data('data-object', null).val(null).trigger("blur");
                        value = null;
                    }
                }
            };

            if (key === 'locationId' && window.location.pathname.includes('personal/private')) $('[name="locationId"]').clearFieldIfNotFromList();
            validateField(key, value,
                function (key, value) {
                    setFieldValid(key, value);
                    if (handleValid) handleValid(key, value);
                    if (isValidationCallbackEvent) {
                        if (options && options.onFieldValid && validationState[key] !== '') options.onFieldValid(key);
                        validationState[key] = '';
                    }
                }, function (key, value, description) {
                    if (!onlyToValid) setFieldInvalid(key, value, description);
                    if (handleInvalid) handleInvalid(key, value, description);
                    if (isValidationCallbackEvent) {
                        if (options && options.onFieldInvalid && validationState[key] !== description) options.onFieldInvalid(key);
                        validationState[key] = description;
                    }
                }, function (jqxhr, textStatus, error) {
                    setFieldValid(key, value);
                    if (handleValid) handleValid(key, value);
                    handleAjaxFail(jqxhr, textStatus, error);
                });
        }

        const lastValidatedValue = {};

        function validateField(key, value, handleValid, handleInvalid, handleError, formData) {
            var component = fieldMap[key];
            var rules = component.validate;

            formData = formData || getFormData();

            function hasTag(tag) {
                return component.tags && component.tags.indexOf(tag) > -1
            }

            function ajaxValidate(path, failMessage, handleValidFun) {
                ajaxValidateCall(path, function (valid, responseMessage) {
                    if (typeof failMessage === 'function') {
                        failMessage = failMessage(responseMessage);
                    }
                    valid ? (handleValidFun ? handleValidFun(key, value) : handleValid(key, value)) :
                        handleInvalid(key, value, failMessage);
                });
            }

            function ajaxValidateCall(path, handler) {
                $.ajax({
                    headers: {
                        "ga-id": ubeCookie('_ga') || "",
                        "d-id": ubeCookie('_d') || ""
                    },
                    url: api_url + path,
                    success: function (t) {
                        var result = t.result;
                        var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;

                        context.addValidationResult(key, value, valid, path);

                        handler(valid, t.message);
                    },
                    error: handleError
                });
            }

            if (!handleVisibility(key, formData || getFormData())) return handleValid(key, value);
            if (rules) {
                var customMessage = (rules.customMessage && rules.customMessage != "") ? rules.customMessage : ("Пожалуйста, укажите " + component.label);
                if (rules.required && (value || "").length == 0) {
                    return handleInvalid(key, value, customMessage);
                }
                if (rules.pattern && rules.pattern.length > 0 &&
                    !(new RegExp(rules.pattern)).test(value))
                    return handleInvalid(key, value, customMessage);
                if (rules.custom && rules.custom.length > 0) {
                    var mul = new Function('valid, input, query, data, initialData', rules.custom + "; return valid;");
                    var customResult = mul(true, value, query, formData || getFormData(), {...options.data});
                    if (customResult != true && customResult && customResult.length > 0)
                        return handleInvalid(key, value, customResult);
                }
            }

            function handleValidFromOption(key, value) {
                if (value && value.length > 0 && options.validateValue) options.validateValue(key, value, handleValid, handleInvalid);
                else handleValid(key, value);

                if(value && value !== "" && hasTag("submitOnValid") && lastValidatedValue[key] !== value) container.find("form").submit();

                lastValidatedValue[key] = value;
            }


            if (hasTag("validateServerSide")) {
                var requestData = {
                    firstName: formData.firstName,
                    userId: formData.userId
                }
                requestData[key] = value;
                return $.ajax({
                    headers: {
                        "ga-id": ubeCookie('_ga') || "",
                        "d-id": ubeCookie('_d') || ""
                    },
                    url: host + "/esb/" + name + "/validate" + (sessionKey ? ("?sessionKey=" + sessionKey) : ""),
                    method: "post",
                    data: JSON.stringify(requestData),
                    contentType: 'application/json; charset=UTF-8',
                    success: function (t) {
                        if (t.sessionKey) sessionKey = t.sessionKey;
                        var result = t && t.result && t.fields && t.fields[key] && t.fields[key].result;
                        if(result && key === 'submittedPersonalCode') {
                            setFieldValue("personalDataChanged", false);
                        }
                        var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;
                        if (valid) handleValidFromOption(key, value);
                        else handleInvalid(key, value, t && t.fields && t.fields[key] && t.fields[key].message ?
                            t.fields[key].message : "Введите корректное значение");
                    },
                    error: handleError
                });
            }

            if (component.type == 'email') {

                if (key === "email" && hasField(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") !== value) {
                    setFieldValue(key + "CodeSent", false);
                    setFieldValue(key + "ValidatedValue", null);
                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                    validateComponent("submitted" + capitalize(key) + "Code");
                    handleFormVisibility();
                }

                //Do not validate email if not provided
                if (!value || value == "" || hasTag("disableServerValidation")) return handleValid(key, value);

                return ajaxValidate("/validate/email?email=" + value + "&entity=" + name + "&optin=" + hasTag("optin"),
                    function (responseMessage) {
                        if(responseMessage === "Foreign Email") return "Необходимо указать российский email адрес"
                        else return component.validate.customMessage || "Некорректный или не существующий email адрес"
                    },
                    function () {
                        var userId = hasField("userId") ? getFieldValue("userId") : null;
                        var userIdPart = userId ? ("&userId=" + userId) : "";
                        var uniqueError = component.uniqueError;
                        hasTag("validateNotExists") ?
                            ajaxValidate("/validate/emailNotExists?email=" + value + userIdPart, (uniqueError && uniqueError !== "") ? uniqueError : "E-Mail адрес уже был зарегистрирован ранее") :
                            handleValidFromOption(key, value);
                    });
            }
            if (component.type == 'phoneNumber') {

                if (key === "phone" && hasField(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") !== value) {
                    setFieldValue(key + "CodeSent", false);
                    setFieldValue(key + "ValidatedValue", null);
                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                    validateComponent("submitted" + capitalize(key) + "Code");
                    handleFormVisibility();
                }
                if (hasTag("disableServerValidation")) return handleValid(key, value);
                return ajaxValidate("/validate/phone?number=" + value  + "&entity=" + name,
                    function(responseMessage) {
                        if (responseMessage && responseMessage.includes('Что-то пошло не так')) return responseMessage
                        else return component.validate.customMessage || "Введите существующий номер телефона"
                    },
                    function () {
                        var userId = hasField("userId") ? getFieldValue("userId") : null;
                        var userIdPart = userId ? ("&userId=" + userId) : "";
                        var uniqueError = component.uniqueError;
                        hasTag("validateNotExists") ?
                            ajaxValidate("/validate/phoneNotExists?number=" + value + userIdPart, (uniqueError && uniqueError !== "") ? uniqueError : "Телефон уже был зарегистрирован ранее") :
                            handleValidFromOption(key, value);
                    });
            }
            if (value && value.length > 0 && key === 'coupon') {
                return ajaxValidateCall("/validate/coupon?code=" + value + "&entity=" + name,
                    function (valid, message) {
                        if (valid) handleValid(key, value);
                        else if (options.validateValue)
                            options.validateValue(key, value, handleValid, handleInvalid);
                        else handleInvalid(key, value, message || "Введите существующий код");
                    });
            }

            if (value && value.length > 0 && key == 'createdEmail') {
                const path = api_url + "/nng/email/validate?email=" + value;
                return $.ajax({
                    headers: {
                        "ga-id": ubeCookie('_ga') || "",
                        "d-id": ubeCookie('_d') || ""
                    },
                    url: path,
                    success: function (t) {
                        var result = t.result;
                        var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;

                        context.addValidationResult(key, value, valid, path);
                        if (t.result) handleValid(key, value)
                        else handleInvalid(key, value, t.message)
                    },
                    error: function(err) {
                        handleInvalid(key, value, err.responseJSON.message)
                    }
                });
            }

            if (value && value.length > 0 && hasTag("validateBonusCard"))
                return ajaxValidateCall("/validate/bonusCard?value=" + value + "&entity=" + name,
                    function (valid, message) {
                        if (valid) handleValid(key, value);
                        else handleInvalid(key, value, message);
                    });

            handleValidFromOption(key, value);
        }

        function getFieldObject(key) {
            return getField(key).data('data-object') || getFieldValue(key);
        }

        function getFormData(part) {
            var formData = {};
            var { utm_source, utm_campaign, utm_medium, utm_content, utm_term,
                utmSource, utmCampaign, utmMedium, utmContent, utmTerm } = query;
            const scanToken = getQueryParameter(window.location.search, 'scanToken');

            formData.hashParams = fingerPrint.fingerprintData;
            formData.deviceParams = device.getDeviceData;
            formData.utmSource = utm_source || utmSource;
            formData.utmCampaign = utm_campaign || utmCampaign;
            formData.utmMedium = utm_medium || utmMedium;
            formData.utmContent = utm_content || utmContent;
            formData.utmTerm = utm_term || utmTerm;
            formData.noLoginSessionKey = options.noLoginSessionKey;

            if(options.coupon) {
                formData.coupon = options.coupon;
            }

            if (scanToken) {
                formData.scanToken = scanToken;
            }

            if($.ube.impressionToken) {
                formData.impressionToken = $.ube.impressionToken;
            }

            if(!isLeadForm) {
                formData.isFaceSkipped = options.isFaceSkipped || JSON.parse(ubeSession('isFaceSkipped'));
                formData.jwtFaceToken =  options.jwtFaceToken || ubeCookie('UBE_JWT_FACE_TOKEN');
            }
            
            fieldNamesByPart(part).forEach(function (key) {
                formData[key] = getFieldValue(key);
                if (!formData[key] && ubeSession(key)) formData[key] = ubeSession(key);
            });

            formData.service = {
                deviceScreen: detectDeviceScreen()
            };

            try {
                formData.ga4UserId = getGA4UserId();
                formData.ga4SessionId = getGA4SessionId();
            } catch (err) {}

            formData.pageUrl = location.href;
            formData.referrerUrl = document.referrer;

            //Calculate calculate values
            fieldNamesByPart(part).forEach(function (key) {
                var component = fieldMap[key];

                var calculateValue = component.calculateValue;
                if (key == "externalId") {
                }
                if (calculateValue && calculateValue.length > 0) {
                    var mul = new Function('value, data, helper, query, initialData', calculateValue + "; return value;");
                    var helper = {getFieldObject: getFieldObject};
                    var calculationResult = mul(formData[key], formData, helper, query, {...options.data});
                    formData[key] = calculationResult;
                }
            });

            return formData;
        }

        function handleVisibility(key, formData) {
            return toggleVisible(key, isVisible(key, formData));
        }

        function handleFormVisibility(exceptKey) {
            var formData = getFormData();
            fieldNames.forEach(function (key) {
                if (key != exceptKey) handleVisibility(key, formData);
            });
        }

        function handleResponseErrors(response) {
            if (response.statusCode === 400 && response.errors?.length > 0) {
                var invalids = {};
                response.errors.forEach(function (d) {
                    var key = d.path;
                    var description = d.error;
                    invalids[key] = description;
                    setFieldInvalid(key, null, description);
                });
                if (options && options.onValidationFailure)
                    options.onValidationFailure(invalids);
                console.log("UBE :: Server-side validation FAIL");
                console.log(invalids);
            } else if (response.message?.length > 0) {
                showPopup(response.message);
            }
        }

        function isVisible(key, formData) {
            var component = fieldMap[key];
            var conditional = component.conditional;
            var customConditional = component.customConditional;

            var byConditional = true;
            var byCustomConditional = true;
            var checkIfNotEmpty = function (v) {
                if (!!v !== v)
                    return v && v.length > 0
                return v;
            };
            if (conditional && checkIfNotEmpty(conditional.show) && conditional.when &&
                conditional.when.length > 0 && conditional.eq && conditional.eq.length > 0) {
                var show = (conditional.show == "true" || conditional.show == true);

                if ((formData[conditional.when] || "").toString() ==
                    (conditional.eq).toString()) byConditional = show;
                else byConditional = !show;
            }
            if (customConditional && customConditional.length > 0) {
                var mul = new Function('show, data, helper, query, initialData', customConditional + "; return show;");
                var helper = {getFieldObject: getFieldObject};
                var show = mul(true, formData, helper, query, {...options.data});
                byCustomConditional = !(show == false || show == "false");
            }
            return byConditional && byCustomConditional;

        }

        function toggleVisible(key, visible) {
            var element = container.find(".ube-visibility-show-for-" + key);
            var hideElement = container.find(".ube-visibility-hide-for-" + key);
            var component = fieldMap[key];

            if (!visible) {

                var wasVisible = element.is(":visible");

                if (wasVisible && component.tags && component.tags.indexOf("getFRToken") >= 0) {
                    events.getFRToken = false;
                    container.find("form").trigger("stopVideoCapture").off("stopVideoCapture");
                    $(".ube-face-error").hide();
                    $(".ube-face-container").show();
                }
            }

            if (visible) {
                var wasVisible = element.is(":visible");
                if(element.attr("data-ube-display"))
                    element.css("display", element.attr("data-ube-display"));
                else
                    element.show();
                hideElement.hide();

                /**
                 * Мегафон отсылается только раз (ограничение раз в сутки), поэтому услови И
                 */
                if (!wasVisible && !events.initIdx && component.tags && component.tags.includes("initIdx")) {

                    gaPush(categoryPrefix + "av_process", "click - button - idx");

                    events.initIdx = true;
                    toggleLoader(false);
                }


                /**
                 * Мегафон отсылается только раз (ограничение раз в сутки), поэтому услови И
                 */
                if (!wasVisible && !events.sendMegafonCode && component.tags && component.tags.indexOf("sendMegafonCode") >= 0) {

                    gaPush("AV", "Initialize", "megafon");

                    events.sendMegafonCode = true;
                    toggleLoader(true);
                    setTimeout(function () {
                        container.find("form").trigger("submitNoValidation");
                    }, 100);

                }

                /**
                 * К FR можно возвращаться, поэтому указывается условие ИЛИ
                 */
                if ((!wasVisible || !events.getFRToken) && component.tags && component.tags.indexOf("getFRToken") >= 0) {

                    events.getFRToken = true;
                    toggleLoader(true);
                    setFieldValue("token", null);
                    setFieldValue("tokenUrl", null);
                    setTimeout(function () {
                        container.find("form").trigger("submitNoValidation");
                    }, 100);

                }
               //container.find("input[name='"+key+"']").show();
            }
            else {
                element.hide();
                if(hideElement.attr("data-ube-display"))
                    hideElement.css("display", hideElement.attr("data-ube-display"));
                else
                    hideElement.show();
                //container.find("input[name='"+key+"']").hide();
            }
            return visible;
        }

        function validateAllFields(handleValid, handleInvalid, fieldNames) {
            handleValid = handleValid || function () {
            };
            handleInvalid = handleInvalid || function () {
            };
            var status = {};
            var invalids = {};
            var size = fieldNames.length;

            function checkFinish() {
                if (Object.keys(status).length < size) return;
                if (Object.keys(invalids).length == 0)
                    return handleValid();
                else
                    return handleInvalid(invalids);
            }

            var formData = getFormData();

            fieldNames.forEach(function (key) {
                var value = getFieldValue(key);
                var visible = handleVisibility(key, formData);

                validateField(key, value,
                    function (key, value) {
                        status[key] = "valid";
                        setFieldValid(key, value);
                        checkFinish();
                    }, function (key, value, description) {
                        //alert(key+": "+value+": "+description);
                        status[key] = "invalid";
                        invalids[key] = description;
                        setFieldInvalid(key, value, description);
                        checkFinish();
                    }, function (jqxhr, textStatus, error) {
                        status[key] = "error";
                        setFieldValid(key, value);
                        handleAjaxFail(jqxhr, textStatus, error);
                        checkFinish();
                    }, formData);

            });
        }

        var isLoading = false;

        function toggleLoader(visible) {
            isLoading = visible;
            console.log("UBE Toggle loader " + visible);
            if (options.toggleLoader) options.toggleLoader(visible);
        }

        function showPopup(message) {
            if (options.showPopup)
                options.showPopup(message);
            else {
                console.log(message);
                alert(message);
            }
        }

        var handle_form = function () {
            var form = container.find("form");
            var path = json.path;
            var action_path;
            var ga_name;
            let isCouponValidateMode = options.config?.coupon?.validateMode;
            phoneConfirmationType = json?.properties?.confirmationType || ubeSession('phoneConfirmationType');
            const isFRPassed = !!ubeCookie(cookies.UBE_AGE_VERIFIED_TOKEN);
            const promoCampaignName = sessionStorage.getItem('promoCampaignName');
            var fileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'images/jpeg', 'images/jpg', 'images/png', 'images/gif', 'application/pdf'];

            factory.autoCreateAbsentFields();

            const timer = new Timer();

            if (/-reg$/.test(path)) {
                action_path = actionPathReg(options, path, isLeadForm, formProperties);
                const category = isQRForm ? 'dl_qr_registration_start' : 'dl_auth_registration_start';
                if (!isMBEPForm) {
                    if (ubeSession('shouldSkipEmail') === 'true') {
                        gaPush(category, 'form - registration - with_email');
                    } else if (ubeSession('shouldSkipEmail') === 'false') {
                        gaPush(category, 'form - registration - wo_email');
                    }

                    gaPush(category, "form - registration");
                }

                if(isMBEPForm) {
                    gaPushObject({
                        event: 'dl-pageview',
                        pageURL: window.location.href,
                        pageType: 'auth_nonBrand'
                    })
                }
                if (isQRForm) gaPush("qr_reg", isFRPassed ? "fr - success" : "fr - fail - screen_2", promoCampaignName);
                ga_name = "Registration";
            }
            else if (/optin$/.test(path)) {
                action_path = "/esb/" + path + "/submitCodes";
                const category = categoryPrefix + '2optin_start';
                const action = 'form - 2optin';
                gaSkipEmailOptin(category, action);
                gaPush(category, action);
                ga_name = "2OPTIN";
            }
            else if (/av$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "AV";
                if (hasField("faceMethod")) {
                    gaPush(categoryPrefix + 'av_process', 'view - screen_av_fork');
                } else if (hasField("richcallMethod")) {
                    options.richcall && options.richcall();
                } else {
                    gaPush(categoryPrefix + "av_idx_start", "form - idx");
                }
            }
            else if (/login$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "Login";
                gaPush(categoryPrefix + "auth_password_start", "form - password");
                if(isMBEPForm) {
                    gaPushObject({
                        event: 'dl-pageview',
                        pageURL: window.location.href,
                        pageType: 'auth_nonBrand'
                    })
                }
            }
            else if (/remind/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "LoginRemind";
                gaPush(categoryPrefix + "auth_resetPassword_start", "form - resetPassword");
                if(isMBEPForm) {
                    gaPushObject({
                        event: 'dl-pageview',
                        pageURL: window.location.href,
                        pageType: 'auth_passwordReset'
                    })
                }
            }
            else if (/cabinet/.test(path)) {
                action_path = "/esb/" + path + "/cabinet";
                ga_name = "PersonalCabinet";
            }
            else if (/instagram/.test(path)) {
                action_path = "/esb/" + path + "/instagram";
                ga_name = "UpdateInstagram";
                gaPush(ga_name, "Start");
            }
            else if (/-vk$/.test(path)) {
                action_path = "/esb/" + path + "/vk";
                ga_name = "UpdateVK";
                gaPush(ga_name, "Start");
            }
            else if (/-phone$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "PhoneVerification";
            }
            else if (/-phone-check$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
            }
            else if (/-phone-send$/.test(path)) {
                action_path = "/esb/" + path + "/submission";

                if (phoneConfirmationType) ubeSession('phoneConfirmationType', phoneConfirmationType);

                if (isMBEPForm && !isP1Domain()) {
                    gaPushObject({
                        event: 'dl-pageview',
                        pageURL: window.location.href,
                        pageType: 'auth_nonBrand'
                    });

                    gaPush("dl_auth_phone_start", "form - phone");
                } else if (isQRForm) {
                    gaPush("qr_phone", isFRPassed ? "fr - success" : "fr - fail", promoCampaignName);
                }
            }
            else if (/-idx$/.test(path)) {
		            action_path = "/esb/" + path + "/submission";
		            ga_name = "IDXVerification";
		            gaPush(categoryPrefix + "av_idx_registration_start", "form - idx_reg");
                    if (isQRForm) gaPush("qr_reg", "fr - fail - screen_1", promoCampaignName);
            }
            else if (/-coupon$/.test(path)) {
                const key = path.replace('-coupon', '-reg');
                if(isCouponValidateMode) {
                    action_path = "/api/validate/coupon?catalog=dte-coupon&entity=" + key;
                } else {
                    action_path = "/api/coupon/assignBenefit/" + key;
                }
            }
            else {
                action_path = "/main/" + path + "/submission";
                gaPush(path, "Start");
                ga_name = path;
            }


            function ajaxSubmitFormInternal(data, isSearchOnly) {
                var requestPath = action_path;
                let method = 'POST';
                const key = sessionKey || options.sessionKey;
                const authorizationHeader = key ? `Bearer ${key}` : undefined;
                const useCoreCRM = formProperties.useCoreCRM && requestPath.includes('/api/session/core/registration/');
                const dteCoupon = requestPath.includes('/api/coupon/assignBenefit/');
                const preferredMethod = ubeSession('preferredMethod');


                //TODO remove doubling
                var label;
                if(ga_name === "AV") label = data.data.method;
                else if(ga_name === "Login") label = "password";
                else if(ga_name === "Registration") label = data.data.utmSource;

                gaPushObject(data.data);

                let payload = data;

                if(isCouponValidateMode && requestPath.includes('/api/validate/coupon')) {
                    let couponCode = $('input[name="couponCode"]').val();
                    method = 'GET';
                    requestPath += "&code=" + couponCode;
                    payload = undefined;
                }

                form.attr("action", host + requestPath);

                if(options?.data?.preferredMethod) {
                    payload.data.preferredMethod = options.data.preferredMethod;
                }

                if(options.transformPayload) {
                    if (typeof options.transformPayload === 'function') {
                        payload = options.transformPayload(payload);
                    }
                    else {
                        throw new Error('options.transformPayload must be a function(object) {return object;}');
                    }
                }

                if(useCoreCRM || dteCoupon) {
                    payload = data.data;
                }

                data.isSearchOnly = isSearchOnly;
                $.ajax({
                    type: method,
                    headers: {
                        "ga-id": ubeCookie('_ga') || "",
                        "d-id": ubeCookie('_d') || "",
                        "ym-id": ubeCookie('_ym_uid') || "",
                        "Authorization": authorizationHeader
                    },
                    url: form.attr("action"),
                    data: JSON.stringify(payload),
                    contentType: 'application/json; charset=UTF-8',
                    success: function (result) {
                        toggleLoader(false);
                    },
                    error: function (xhr, resp, text) {
                        if (/-reg$/.test(path)) {
                            action_path = actionPathReg(options, path, isLeadForm);
                            const category = isQRForm ? 'dl_qr_registration_fail' : 'dl_auth_registration_fail';
                            gaPush(category, "form - registration - reason: technical");
                            if(isMBEPForm) {
                                if ($('.reg-form_step_0').is(':visible'))  gaPush('dl_av_idx_registration_fail', "form - idx_reg - reason: technical");
                                gaPushObject({
                                    event: 'dl-pageview',
                                    pageURL: window.location.href,
                                    pageType: 'auth_nonBrand'
                                })
                            }
                            if (isQRForm) gaPush("qr_reg", isFRPassed ? "fr - success" : "fr - fail - screen_2", promoCampaignName);
                            ga_name = "Registration";

                            if(useCoreCRM) {
                                handleResponseErrors(xhr.responseJSON)
                            }
                        }
                        else if (/optin$/.test(path)) {
                            action_path = "/esb/" + path + "/submitCodes";
                            gaPush(categoryPrefix + "2optin_fail", "form - 2optin - reason: technical");
                            ga_name = "2OPTIN";
                        }
                        else if (/av$/.test(path)) {
                            action_path = "/esb/" + path + "/submission";
                            gaPush(categoryPrefix + "av_idx_fail", "form - idx - reason: technical");
                            ga_name = "AV";
                        }
                        else if (/-phone-check$/.test(path)) {
                            action_path = "/esb/" + path + "/submission";
                            ga_name = "PhoneCodeVerification";
                            const category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                            const phoneTypeActions = {
                                telegram: 'number - form - phone_telegram_push - reason: technical',
                                sms: 'number - form - phone_sms_code - reason: technical',
                                flashingCall: 'number - form - phone_call_code - reason: technical'
                            }
                            let action;

                            if (isMBEPForm && !isP1Domain()) {
                                action =  'form - phone_number - reason: technical';
                            } else if (preferredMethod) {
                                action = phoneTypeActions[preferredMethod];
                            } else if (phoneConfirmationType) {
                                action = phoneTypeActions[phoneConfirmationType];
                            }

                            gaPush(category, action);
                        }
                        else if (/-phone-send$/.test(path)) {
                            action_path = "/esb/" + path + "/submission";
                            const category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                            const phoneTypeActions = {
                                telegram: 'telegram_push - form - phone_telegram_push',
                                sms: 'sms_code - form - phone_sms_code',
                                flashingCall: 'call_code - form - phone_call_code'
                            }
                            let action;

                            if(remainingAttemptsCount) {
                                updatePhoneTypeActions(phoneTypeActions, ` - attempts_left: ${remainingAttemptsCount}`);
                            } else {
                                updatePhoneTypeActions(phoneTypeActions, ' - reason: technical');
                            }

                            if(isMBEPForm && !isP1Domain()) {
                                action = 'form - phone_code - reason: technical';
                            } else if (preferredMethod) {
                                action = phoneTypeActions[preferredMethod];
                            } else if (phoneConfirmationType) {
                                action = phoneTypeActions[phoneConfirmationType];
                            }

                            gaPush(category, action);
                        }
                        else if (/-idx$/.test(path)) {
                             action_path = "/esb/" + path + "/submission";
                             ga_name = "IDXVerification";
                             gaPush(categoryPrefix + "av_idx_registration_fail", "form - idx_reg - reason: technical");
                             if (isQRForm) gaPush("qr_reg", "fr - fail - screen_1", promoCampaignName);
                         }
                        else if(/-coupon$/.test(path)) {
                            handleResponseErrors(xhr.responseJSON);
                        }


                        if (xhr?.responseJSON?.error && xhr?.responseJSON?.error?.length > 0) {
                            showPopup(xhr.responseJSON.error);
                        }

                        toggleLoader(false);
                        console.log("UBE :: Form submission ERROR");
                        console.log(xhr, resp, text);
                    }
                })
                    .done(function (result) {

                        function handleResult(result) {
                            if (result.data) {
                                if(result.data.userId) gaUserId(result.data.userId);
                                else if(result.data.data && result.data.data.userId) gaUserId(result.data.data.userId);
                            }
                            if (result.sessionKey) sessionKey = result.sessionKey;

                            if (result.data && result.data.requireConsent && typeof $.ube.showTermsPopup === "function") {
                                return $.ube.showTermsPopup(result.data.sessionKey, result.data.termsCode, function () {
                                    return acceptTerms(result.data.sessionKey, path, result.data.termsCode, api_url);
                                }, result.data.userId).then(function (respond) {
                                    const buff = {
                                        ...result,
                                        data: {
                                            ...result.data,
                                            requireConsent: false
                                        }
                                    };

                                    return handleResult(buff);
                                }).catch(function (err) {
                                    console.log('Error while showing terms popup', err);
                                });
                            }

                            if (result.event == "enterPassword" && typeof $.ube.enterPassword === "function") {
                                return $.ube.enterPassword(result.data.sessionKey, function (newPassword) {
                                    return setPassword(result.data.sessionKey, path, newPassword, api_url);
                                }, result.data.userId).then(function (respond) {
                                    const buff = {
                                        ...result,
                                        event: 'loginSuccess'
                                    };

                                  return handleResult(buff);
                                }).catch(function (err) {
                                    console.log('Error while setting password', err);
                                });
                            }

                            if (result.event == "enterPassword" && typeof $.ube.enterPassword !== "function") {
                                const buff = {
                                    ...result,
                                    event: 'loginSuccess'
                                };

                              return handleResult(buff);
                            }

                            function gaCheck(error) {
                                if(ga_name === 'PhoneCodeVerification') gaPush(categoryPrefix + 'auth_fail', 'method: phone - invalid-password', 'Введен некорректный логин (email или моб. телефон)')
                                else if(ga_name === 'Login') gaPush(categoryPrefix + 'auth_password_fail', 'form - password - reason: ' + error);
                                else if(ga_name === 'LoginRemind') gaPush(categoryPrefix + 'auth_resetPassword_fail', 'form - resetPassword - reason: ' + error);
                            }

                            if (result.name === "ValidationError") {
                                var invalids = {};
                                result.details.forEach(function (d) {
                                    var key = d.path;
                                    var description = d.message;
                                    invalids[key] = description;
                                    setFieldInvalid(key, null, description);
                                });
                                if (options && options.onValidationFailure)
                                    options.onValidationFailure(invalids);

                                if($('.remaining-attempts-count').length && path.endsWith('phone-check')) {
                                    const count = result.details[0].remainingAttempts;
                                    if(count >= 0) {
                                        remainingAttemptsCount = count;
                                        $('.remaining-attempts-count').text(`Осталось ${pluralize(count, ['попытка', 'попытки', 'попыток'])}`);
                                    } else {
                                        $('.remaining-attempts-count').text('');
                                        remainingAttemptsCount = '';
                                    }
                                }
                                console.log("UBE :: Server-side validation FAIL");
                                console.log(invalids);
                            }
                            else if (result.error && result.error.length > 0) {
                                gaCheck("error");
                                showPopup(result.error);
                            }
                            else if(result.event === 'updateApprove') {
                                window.popup.open("#profile-edit-popup");
                                $(document).on("mousedown", '.profile__edit-popup-submit', function() {
                                    setFieldValue('personalDataChangeApproved', true);
                                    $("[name=popup]").val('non-av')
                                    onFormSubmit('changeContacts');
                                    window.popup.close();
                                    setTimeout(() => setFieldValue('personalDataChangeApproved', false), 4000)
                                })
                            }
                            else if (result.event == "update") {
                                reloadFormData(result.data);
                            }
                            else if (result.event == "face") {
                                reloadFormData(result.data);
                                initializeFaceCapture();
                            }
                            else if (result.event == "beforeSubmit") {
                                var callback = (function () {
                                    return ajaxSubmitFormInternal(data, false);
                                });
                                if (options.onBeforeSubmit) options.onBeforeSubmit(data, result.data, callback, setFieldInvalid);
                                else callback();
                            }
                            else if (result.event == "requireConsent") {
                                gaPush("Consent", "Show");
                                var template = result.data.template;
                                var component = $(template);
                                component.appendTo("body");
                                component.find(".ube-form-submit-click").click(function (e) {
                                    gaPush("Consent", "Agree");
                                    e.preventDefault();
                                    component.trigger("remove").remove();
                                    data.agreeWithNewConsents = true;
                                    validateSetCaptchaProof(container, data, captchaType, ajaxSubmitFormInternal);
                                    return false;
                                });
                                component.find(".ube-trigger-event[data-ube-event=close]").click(function (e) {
                                    gaPush("Consent", "Close");
                                    e.preventDefault();
                                    component.trigger("remove").remove();
                                    return false;
                                });
                            }
                            else if (result.event == 'loginSuccess') {
                              submissionSuccess(result);
                            }
                            else if (options.onSubmissionSuccess) {
                                submissionSuccess(result);
                            }
                        }

                        function submissionSuccess(result) {
                            /**
                             * Очистка сессии только после заполнения формы регистрации
                             */
                            const mainRegistrationSteps = ['PhoneVerification', 'PhoneCodeVerification', 'IDXVerification'];
                            const { event, data } = result;

                            if (!mainRegistrationSteps.includes(ga_name)) clearSessionFields();
                            if (name.includes('phone-send')) {
                                const category = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                                const phoneTypeActions = {
                                    telegram: 'send - telegram_push_to_las - form - phone_telegram_push',
                                    sms: 'send - sms_code_to_las - form - phone_sms_code',
                                    flashingCall: 'send - call_code_to_las - form - phone_call_code'
                                }
                                let action;

                                if(isMBEPForm && !isP1Domain()) {
                                    action = 'send - code';
                                } else if (preferredMethod) {
                                    action = phoneTypeActions[preferredMethod];
                                } else if (phoneConfirmationType) {
                                    action = phoneTypeActions[phoneConfirmationType];
                                }

                                gaPush(category, action);
                            } else if (name.includes('-phone-check')) {
                                if(event === 'loginSuccess' && data.userId) ubeCookie(cookies.UBE_USERID, data.userId, sessionExpiration());

                                const category = isQRForm ? 'dl_qr_phone_success' : 'dl_auth_phone_success';
                                const status = result.event === 'loginSuccess' ? 'in_base' :'not_in_base';
                                const phoneTypeActions = {
                                    telegram: `form - phone_telegram_push - (${status})`,
                                    sms: `form - phone_sms_code - (${status})`,
                                    flashingCall: `form - phone_call_code - (${status})`
                                }
                                let action;

                                if(remainingAttemptsCount) {
                                    updatePhoneTypeActions(phoneTypeActions, ` - attempts_left: ${remainingAttemptsCount}`);
                                }

                                if(isMBEPForm && !isP1Domain()) {
                                    action = `form - phone - (${status})`;
                                } else if (preferredMethod) {
                                    action = phoneTypeActions[preferredMethod];
                                } else if (phoneConfirmationType) {
                                    action = phoneTypeActions[phoneConfirmationType];
                                }

                                gaPush(category, action);
                                ubeSession('phoneConfirmationType', null);
                                ubeSession('preferredMethod', null);
                            } else if (name.includes('-reg')) {
                                data?.data?.userId && ubeCookie(cookies.UBE_USERID, data.data.userId, sessionExpiration());
                                const category = isQRForm ? 'dl_qr_registration_success' : 'dl_auth_registration_success';
                                const action = 'form - registration';
                                gaSkipEmailOptin(category, action);
                                gaPush(category, action);
                            } else if (name.includes('-optin')) {
                                data?.data?.userId && ubeCookie(cookies.UBE_USERID, data.data.userId, sessionExpiration());
                                const category = categoryPrefix + '2optin_success';
                                const action = 'form - 2optin';
                                gaSkipEmailOptin(category, action);
                                gaPush(category, action);
                            } else if (name.includes('-av')) {
                                if (!hasField('faceMethod') || data.data.method === 'document') {
                                    gaPush(categoryPrefix + 'av_idx_success', 'form - idx - document: ' + data.data.documentType);
                                }
                            } else if (name.includes('-idx')) {
                                gaPush(categoryPrefix + 'av_idx_registration_success', 'form - idx_reg');
                            }
                            if(ga_name === 'LoginRemind') gaPush(categoryPrefix + 'auth_resetPassword_success', 'form - resetPassword');
                            else if(ga_name === 'Login') {
                                let action;

                                switch (result.source) {
                                    case 'sms': action = 'phone'; break;
                                    case 'password': action = 'email'
                                }

                                gaPush(categoryPrefix + 'auth_password_success', `form - password - ${action}`);
                            }
                            var submissionId = result.data?.submissionId;
                            var userId = result.data?.userId;
                            if (result && result.data && result.data.data) {
                                submissionId = submissionId || result.data.data.submissionId;
                                userId = userId || result.data.data.userId;
                            }
                            if(result && result.data && result.data.sessionKey) ubeCookie('ube_session_key', result.data.sessionKey, sessionExpiration())
                            options.onSubmissionSuccess(submissionId, userId, result);
                            container.add(form).trigger("formSuccess", data, result);

                            resetOptinAfterSubmission();
                        }

                        if (Array.isArray(result)) {
                            result.forEach(function (r) {
                                handleResult(r)
                            });
                        } else {
                            handleResult(result);
                        }
                    });
            }

            function ajaxSubmitForm(data) {
                toggleLoader(true);
                if (data) {
                    data.timer = timer.ends();
                    data.context = context.json;
                }
                return ajaxSubmitFormInternal(data, !!options.onBeforeSubmit);
            }

            form.on("submitNoValidation", function (event) {
                event.preventDefault();
                toggleLoader(true);
                ajaxSubmitForm({
                    data: getFormData()
                });
            });

            function onFormSubmit(part) {
                if (isLoading) return;
                toggleLoader(true);

                var data = {
                    data: getFormData(part)
                };

                var label;
                if(ga_name === "AV") label = data.data.method;
                else if(ga_name === "Login") label = "password";
                else if(ga_name === "Registration") label = data.data.utmSource;

                if (part) data.part = part;

                validateAllFields(function () {
                    const preferredMethod = ubeSession('preferredMethod');

                    if (options.onValidationSuccess)
                        options.onValidationSuccess(data);
                    console.log("UBE :: Form validation SUCCESS");
                    validationState = {};
                    if (/-reg$/.test(path)) {
                        const category = isQRForm ? 'dl_qr_registration_process' : 'dl_auth_registration_process';
                            gaPush(category, 'send - form - registration')
                    }
                    else if (/optin$/.test(path)) {
                        action_path = "/esb/" + path + "/submitCodes";
                        const category = categoryPrefix + '2optin_process';
                        const action = 'send - form - 2optin';
                        gaSkipEmailOptin(category, action);
                        gaPush(category, action);
                        ga_name = "2OPTIN";
                    }
                    else if (/av$/.test(path)) {
                        action_path = "/esb/" + path + "/submission";
                        ga_name = "AV";
                        gaPush(categoryPrefix + 'av_idx_process', `send - form - idx - document: ${data.data.documentType}`);
                    }
                    else if (/login$/.test(path)) {
                        action_path = "/esb/" + path + "/submission";
                        ga_name = "Login";
                        gaPush(categoryPrefix + "auth_password_process", "send - form - password");
                        if(isMBEPForm) {
                            gaPushObject({
                                event: 'dl-pageview',
                                pageURL: window.location.href,
                                pageType: 'auth_nonBrand'
                            })
                        }
                    }
                    else if (/remind/.test(path)) {
                        action_path = "/esb/" + path + "/submission";
                        ga_name = "LoginRemind";
                        gaPush(categoryPrefix + "auth_resetPassword_process", "send - form - resetPassword");
                        if(isMBEPForm) {
                            gaPushObject({
                                event: 'dl-pageview',
                                pageURL: window.location.href,
                                pageType: 'auth_passwordReset'
                            })
                        }
                    }
                    else if (/cabinet/.test(path)) {
                        action_path = "/esb/" + path + "/cabinet";
                        ga_name = "PersonalCabinet";
                    }
                    else if (/instagram/.test(path)) {
                        action_path = "/esb/" + path + "/instagram";
                        ga_name = "UpdateInstagram";
                        gaPush(ga_name, "Start");
                    }
                    else if (/-vk$/.test(path)) {
                        action_path = "/esb/" + path + "/vk";
                        ga_name = "UpdateVK";
                        gaPush(ga_name, "Start");
                    }
                    else if (/-phone$/.test(path)) {
                        action_path = "/esb/" + path + "/submission";
                        ga_name = "PhoneVerification";
                        gaPush(ga_name, "Start");
                    }
                    else if (/-phone-check$/.test(path)) {
                        const category = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                        const phoneTypeActions = {
                            telegram: 'send - telegram_push - form - phone_telegram_push',
                            sms: 'send - sms_code - form - phone_sms_code',
                            flashingCall: 'send - call_code - form - phone_call_code'
                        }
                        let action;

                        if(remainingAttemptsCount) {
                            updatePhoneTypeActions(phoneTypeActions, ` - attempts_left: ${remainingAttemptsCount}`);
                        }

                        if (isMBEPForm && !isP1Domain()) {
                            action = 'send - form - phone_code';
                        } else if (preferredMethod) {
                            action = phoneTypeActions[preferredMethod];
                        } else if (phoneConfirmationType) {
                            action = phoneTypeActions[phoneConfirmationType];
                        }

                        gaPush(category, action);
                    }
                    else if (/-phone-send$/.test(path)) {
                        const category = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                        const phoneTypeActions = {
                            telegram: 'send - number - form - phone_telegram_push',
                            sms: 'send - number - form - phone_sms_code',
                            flashingCall: 'send - number - form - phone_call_code'
                        }
                        let action;

                        if (isMBEPForm && !isP1Domain()) {
                            action = 'send - form - phone_number';
                        } else if (preferredMethod) {
                            action = phoneTypeActions[preferredMethod];
                        } else if (phoneConfirmationType) {
                            const category = isQRDomain() ? 'dl_qr_' : 'dl_auth_';
                            action = phoneTypeActions[phoneConfirmationType];

                            if (phoneConfirmationType === 'telegram') {
                                gaPush(`${category}phone_start`, `form - phone_telegram_push`);
                            } else if (phoneConfirmationType === 'sms') {
                                gaPush(`${category}phone_start`, `form - phone_sms_code`);
                            } else if (phoneConfirmationType === 'flashingCall') {
                                gaPush(`${category}phone_start`, `form - phone_call_code`);
                            }
                        }

                        gaPush(category, action);
                    }
                    else if (/-idx$/.test(path)) {
                        action_path = "/esb/" + path + "/submission";
                        gaPush(categoryPrefix + "av_idx_registration_process", "send - form - idx_reg");
                    }

                    validateSetCaptchaProof(container, data, captchaType, ajaxSubmitForm);

                }, function (invalids) {
                    if (options.onValidationFailure)
                        options.onValidationFailure(invalids);
                    toggleLoader(false);
                    console.log("UBE :: Form validation FAIL");
                    console.log(invalids);

                    var fields = Object.keys(invalids).map(function (key) {
                        return getField(key);
                    });
                    if (options && options.onFieldInvalid) {
                        for (const [key, value] of Object.entries(invalids)) {
                            if (validationState[key] !== invalids[key])
                            options.onFieldInvalid(key, value)
                        }
                        validationState = {...validationState, ...invalids}
                    }
                    $.scrollToElement($(fields).map(function () {
                        return this.toArray();
                    }));

                }, fieldNamesByPart(part));
            }

            form.submit(function (event) {
                event.preventDefault();
                onFormSubmit();
                return false;
            });

            form.find(".ube-form-submit-click").click(function (event) {
                event.preventDefault();
                onFormSubmit($(this).attr("data-part"));
                return false;
            });

            form.find("[type=submit]").click(function (event) {
                event.preventDefault();
                onFormSubmit($(this).filter("[name=part]").val());
                return false;
            });

            function reloadFormData(data, part) {
                var part = data.part;
                if (data.data) data = data.data;
                options.data = data;
                fieldNamesByPart(part).forEach(function (key) {
                    setFieldValue(key, data[key]);
                    getField(key).blur();
                });
            }

            function initializeFaceCapture() {
                var mode;
                var renderContainer = container.find(".ube-camera-container");
                var renderTarget = container.find(".ube-camera-render");
                var captureButton = container.find(".ube-camera-capture");
                var fallbackTarget = container.find(".ube-camera-fallback");
                const vendorsList = options.config?.av?.face?.vendorsList;

                const faceState = {
                    token: getFieldValue("token"),
                    tokenUrl: getFieldValue("tokenUrl"),
                    configName: getKeyFromUrl(url).replace('-av', '-face'),
                    tryCount: 1,
                    options,
                    priorityFaceVendor: options.config?.av?.face?.primaryFaceVendor || 'idx',
                    onSuccess,
                    onError
                }

                if (faceState.priorityFaceVendor === 'yoti' && (renderTarget.data("init") || !token || !tokenUrl)) return false;

                renderTarget.show().data("init", true);

                function switchDocumentMethod() {
                    setFieldValue("method", "document");
                    handleFormVisibility();
                }

                function sendBlobToServer() {
                    toggleLoader(true);
                    runWithPriority(faceState.priorityFaceVendor, vendorsList, faceState);
                }

                function onSuccess(data) {
                    if (faceState.priorityFaceVendor === 'idx') {
                        setFieldValue("tokenUrl", "");
                        setFieldValue("token", data.token);
                    } else if (faceState.priorityFaceVendor === 'yoti') {
                        setFieldValue("token", data.token);
                    }

                    form.trigger("submitNoValidation");
                }

                function onError() {
                    toggleLoader(false);
                    showPopup("Ой! Похоже, что вы выглядите слишком молодо. Попробуйте подтвердить возраст с помощью документов");
                    switchDocumentMethod();
                }

                function renderCameraCapture() {
                    if(isNoCameraStream) {
                        return $.ube.host.includes('test') ? renderFileUpload() : switchDocumentMethod();
                    }
                    fallbackTarget.hide();
                    mode = "stream";

                    renderContainer.addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
                    $('.ube-camera-capture').hide();

                    var onFaceSuccess = ({ img }) => {
                        faceState.b64Img = img;
                        if (options.acsOptions && options.acsOptions.debugMode) {
                            if (!$('#result-image').length) {
                                $('.container').append('<textarea id="result-image"></textarea>');
                            }
                            $('#result-image').text(img);
                        }
                        faceState.blob = imageDataToBlob(img);

                        var dummyForm = $("<form style='position: absolute;top:-2000px;left:-2000px;display: block;'>" +
                            "<input type=\"text\" id=\"filename\" name=\"filename\" />" +
                            "</form>");
                        dummyForm.appendTo("body");
                        var formDataToUpload = new FormData(dummyForm[0]);
                        formDataToUpload.append("image", faceState.blob);

                        var dummyImg = new Image();

                        dummyImg.onload = function() {
                            const imageData = {
                                width: dummyImg.width,
                                height: dummyImg.height,
                                sizeKB: getImageSize(img).toFixed(3)
                            }

                            faceState.aggregatedImageData = {
                                initial: imageData,
                                resized: imageData
                            }
                            faceState.type = 'auto';

                            sendBlobToServer();
                        }
                        dummyImg.src = img;

                        gaPush(categoryPrefix + "av_fr_process", `send - form - fr_auto`);
                    };
                    var onFaceError = err => {
                        const errLabel = err.message || err || 'Unknown error';
                        console.log('Face capture error:', errLabel);
                        gaPush(categoryPrefix + "av_fr_process", `start - form - fr_upload - reason: ${errLabel}`);
                        $.ube.host.includes('test') ? renderFileUpload() : switchDocumentMethod();
                    };
                    var onReadyForCaptureFace = () => {
                        gaPush(categoryPrefix + "av_fr_process", "start - form - fr_auto");
                    }
                    var props = {
                        faceCaptureAssetsRootUrl: $.ube.host + '/js/plugin/',
                        onSuccess: onFaceSuccess,
                        onError: onFaceError,
                        language: 'ru',
                        captureMethod: 'auto',
                        onReadyForCapture: onReadyForCaptureFace,
                        manualCaptureFallback: false
                    };
                    faceState.fcm = Yoti.FaceCaptureModule.render(props, renderTarget[0]);

                    var stopVideoCapture = function() {
                        faceState.fcm.unmount();
                    };

                    form.on("stopVideoCapture", function () {
                        stopVideoCapture();
                    });
                }

                function renderFileUpload() {
                    mode = "upload";
                    renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
                    fallbackTarget.show();
                    renderTarget.hide();

                    var dummyFile = $("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
                    var canvas = $("<canvas class='ube-dummy-image' style='visibility:hidden;display:block;position: absolute;top:-5000px;left:-5000px'></canvas>").appendTo("body")[0];
                    var maxWidth = 2000;
                    var maxHeight = 2000;
                    var maxPixels = 2000000;

                    dummyFile.off("change").change(function () {
                        if (this.files.length === 0) {
                            console.log("File field empty")
                        } else {
                            if (!(fileTypes.indexOf(this.files[0].type) > -1)) {
                                showPopup('Поддерживаются только форматы файлов изображений')
                                return;
                            }

                            var reader = new FileReader();

                            reader.addEventListener("load", function () {
                                var initialImage = this.result;
                                faceState.b64Img = initialImage;

                                var dummyImg = new Image();
                                var resizedImage;
                                dummyImg.onload = function() {
                                    var imageFileSizeKB = getImageSize(initialImage).toFixed(3);
                                    var ctx = canvas.getContext("2d");
                                    const initialImageData = {
                                        width: dummyImg.width,
                                        height: dummyImg.height,
                                        sizeKB: imageFileSizeKB
                                    };
                                    
                                    const isImageValid = resizeImage(dummyImg, maxWidth, maxHeight, maxPixels);

                                    canvas.width = dummyImg.width;
                                    canvas.height = dummyImg.height;
                                    ctx.drawImage(dummyImg, 0, 0, dummyImg.width, dummyImg.height);

                                    resizedImage = canvas.toDataURL('image/jpeg', 0.9);

                                    dummyFile.val("");
                                    dummyFile.wrap('<form>').closest('form').get(0).reset();
                                    dummyFile.unwrap();

                                    const resizedImageData = {
                                        width: dummyImg.width,
                                        height: dummyImg.height,
                                        sizeKB: getImageSize(resizedImage).toFixed(3)
                                    }

                                    const aggregatedImageData = {
                                        initial: initialImageData,
                                        resized: isImageValid ? initialImageData : resizedImageData
                                    }

                                    faceState.blob = imageDataToBlob(isImageValid ? initialImage : resizedImage);
                                    faceState.type = 'upload';
                                    faceState.aggregatedImageData = aggregatedImageData;
                                    sendBlobToServer();
                                }
                                dummyImg.src = initialImage;

                            }, false);

                            reader.readAsDataURL(this.files[0]);
                        }
                        gaPush(categoryPrefix + "av_fr_process", `send - form - fr_upload`);
                    });

                    captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
                        console.log("Capture upload clicked");
                        e.preventDefault();
                        dummyFile.click();
                        return false;
                    });
                }

                renderCameraCapture();


            }



            fieldNames.forEach(function (key) {
                var field = form.find("[name='" + key + "']");
                var component = fieldMap[key];
                var type = component.type;
                var handler = function (onlyToValid, event) {
                    handleFormVisibility(key);
                    validateComponent(key, null, null, onlyToValid, event);
                }

                //set initial value

                var initialValue = options.data[key] || field.attr("data-ube-initial");

                if (key === "ageVerifiedToken" && (!initialValue || initialValue === "")) {
                    try {
                        if (ubeCookie(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                            initialValue = ubeCookie(cookies.UBE_AGE_VERIFIED_TOKEN);
                        } else if (localStorage && localStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                            initialValue = localStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                        }
                    } catch (error) {
                        if (window.backupLocalStorage && window.backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                            initialValue = window.backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                        }
                    }
                }

                if(key === "ageVerified" && (!initialValue || initialValue === "")) {
                    try {
                        if (ubeCookie(cookies.UBE_AGE_VERIFIED)) {
                            initialValue = ubeCookie(cookies.UBE_AGE_VERIFIED);
                        } else if (localStorage && localStorage.getItem(cookies.UBE_AGE_VERIFIED)) {
                            initialValue = localStorage.getItem(cookies.UBE_AGE_VERIFIED);
                        }
                    } catch (error) {
                        if (backupLocalStorage && backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED)) {
                            initialValue = backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED);
                        }
                    }
                }

                if (/-reg$/.test(path) && autoAddSessionFields.indexOf(key) > -1 && ubeSession(key)) {
                    if(!initialValue || initialValue === "") initialValue = ubeSession(key);
                }

                if (component.defaultValue && component.defaultValue.length > 0)
                    initialValue = component.defaultValue;

                if (component.customDefaultValue && component.customDefaultValue.length > 0) {
                    var mul = new Function('value, data, query',
                        component.customDefaultValue + "; return value;");
                    initialValue = mul(initialValue, options.data, query);
                }

                if (initialValue || initialValue != 0) {
                    setFieldValue(key, initialValue);
                    initialValues[key] = initialValue;
                }

                $(".ube-value-update-on-click-" + key).click(function () {
                    const option = $(this).attr("data-option");
                    if (option === 'face') {
                        gaPush(categoryPrefix + 'av_process', 'click - button - fr');
                        gaPush(categoryPrefix + "av_fr_start", "form - fr");
                    } else if (option === 'document') {
                        gaPush(categoryPrefix + 'av_process', 'click - button - idx');
                        gaPush(categoryPrefix + "av_idx_start", "form - idx");
                    }
                    setFieldValue(key, $(this).attr("data-option"));
                    getField(key).blur();
                });

                var common = function (key, handler) {
                    if (type === "checkbox")
                        field.change(function() {
                            handler(false, 'blur')
                        });
                    else if (type === "radio")
                        field.blur(function() {
                            handler(false, 'blur')
                        }).click(handler);
                    else if (type === "file") {
                        field.change(function (e) {
                            if (!(fileTypes.indexOf(this.files[0].type) > -1)) {
                                showPopup('Поддерживаются только форматы файлов изображений и pdf');
                                e.target.value = '';
                                return false;
                            }

                            field.ubeFileToBase64({
                                callback: function() {
                                    handler(false, 'blur')
                                },
                                previewSelector: container.find(`.ube-file-preview-${key || "document"}`)
                            });
                            e.preventDefault;
                            return false;
                        });
                    }
                    else if (type === "select" && $('input[name="' + key + '"]').attr('type') !== 'hidden') {
                        field.on('change', function() {
                            handler(false, 'blur')
                        });
                    }

                    else if (type === "textfield" || type === "phoneNumber" || type === "email" || type === "number") {

                        var wto;
                        var handleChange = function (e) {
                            if (wto) clearTimeout(wto);
                            wto = setTimeout(function () {
                                if(e.code === 'Enter') handler(true, 'blur');
                                else handler(true, 'change');
                            }, 650);
                        };
                        if(isAndroid) field.on('keyup', handleChange);
                        field.on('paste', handleChange).keypress(handleChange).blur(function () {
                            if (wto) clearTimeout(wto);
                            wto = null;
                            handler(false, 'blur');
                        });
                    }
                    else if ($('input[name="' + key + '"]').length > 0 && $('input[name="' + key + '"]').attr('type') !== 'hidden')
                        field.blur(function() {
                            handler(false, 'blur')
                        });
                    else field.blur(handler);
                };
                var custom = options.bindValidation;
                (custom || common)(key, handler, common);

                var inputMask = component.inputMask;
                var placeholder = component.placeholder;
                var inputPlaceholder = component.properties ? component.properties.inputPlaceholder : undefined;
                if (inputMask && inputMask.length > 0) field.ubeMask(inputMask, placeholder, inputPlaceholder);
                if (placeholder && placeholder.length > 0) field.attr("placeholder", placeholder);
                handleFormVisibility();


                //Timer field events
                field.focus(function () {
                    timer.focus(key);
                })
                field.blur(function () {
                    timer.blur(key);
                })

            });

            container.find(".ube-mask").ubeMask();

            function dadataSuggestFio(definition, part) {
                form.find(definition).not("[autocomplete='off']").ubeAutocomplete({
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/fio",
                            data: {
                                query: t.term,
                                part
                            },
                            success: function (t) {
                                e((t.result || []).slice(0, 5))
                            }
                        })
                    }
                });
            }

            dadataSuggestFio('.formio-lookup-name', 'NAME');
            dadataSuggestFio('.formio-lookup-lastname, .formio-lookup-surname', 'SURNAME');
            dadataSuggestFio('.formio-lookup-middlename, .formio-lookup-middlename', 'PATRONYMIC');

            const clearFieldIfNotFromList = function (t, ui) {
                const item = $(this).data('data-object');
                const label = $(this).val();

                if ((!item && label && label !== "") || (item && item.label !== label)) {
                    if (label && $(this).data("source") && $(this).data("source").find(x => x && x.label === label))
                        $(this).data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: $(this).data("source").find(x => x && x.label === label)});
                    else
                        $(this).attr('data-value', null).data('data-object', null).val(null).trigger("blur");
                }
            };

            const fieldItemFocus = function (t, e) {
                $(this).attr('data-value', e.item.value);
                $(this).data('data-object', e.item);
                this.value = e.item.label;
                t.preventDefault()
            };

            container.find(".ube-lookup-cityTrial").ubeAutocomplete({
                source: function (t, e) {
                    $.ajax({
                        url: api_url + "/lookup/cityTrial",
                        data: {
                            query: t.term
                        },
                        success: function (t) {
                            e(t.result.slice(0, 10))
                        }
                    })
                },
                select: function (t, e) {
                    t.preventDefault(), $(this).attr('data-value', e.item.label),
                        $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur");
                },
                focus: fieldItemFocus,
                change: clearFieldIfNotFromList
            }).each(function () {
                var element = $(this);
                function setLocationObject(result) {
                    element.attr('data-value', result.value).data('data-object', result).val(result.label).trigger("blur");
                }
                $.ajax({
                    url: api_url + "/lookup/currentCityTrial",
                    success: function (t) {
                        if (t.result && Array.isArray(t.result) && t.result[0]) setLocationObject(t.result[0])
                    },
                    error: function () {
                    }
                })
            });

            container.find(".ube-lookup-metroTrial").each(function () {
                var element = $(this);
                element.ubeAutocomplete({
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/metroTrial",
                            data: {
                                metro: t.term,
                                city: hasField("city") ? getFieldValue("city") : null
                            },
                            success: function (t) {
                                e(t.result.slice(0, 10))
                            }
                        })
                    },
                    select: function (t, e) {
                        t.preventDefault(), $(this).attr('data-value', e.item.label),
                            $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur");
                    },
                    focus: fieldItemFocus,
                    change: clearFieldIfNotFromList
                });
            });

            container.find(".formio-lookup-address").each(function () {
                var element = $(this);
                var addressPrefix = $(this).attr('data-address-prefix') || "shipping";
                element.ubeAutocomplete({
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/address",
                            data: {
                                query: t.term,
                                city: hasField("city") ? getFieldValue("city") : null
                            },
                            success: function (t) {
                                e(t.result.slice(0, 5))
                            }
                        })
                    },
                    select: function (t, e) {
                        t.preventDefault(), $(this).attr('data-value', e.item.label),
                            $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur");

                        if (e.item && e.item.data) {
                            var d = e.item.data;
                            if (d) {

                                var mapping = {
                                    "setAddress": e.item.label,
                                    "setAddressCity": d.city,
                                    "setAddressKladr": d.kladr_id,
                                    "setAddressCityKladr": d.city_kladr_id,
                                    "setAddressStreet": d.street,
                                    "setAddressStreetType": d.street_type,
                                    "setAddressHouse": d.house,
                                    "setAddressBlock": d.block,
                                    "setAddressFlat": d.flat,
                                    "setPostalCode": d.postal_code
                                };

                                Object.keys(mapping).forEach(function (key) {
                                    fieldNamesByTag(key).forEach(function (fieldName) {
                                        if (fieldName.indexOf(addressPrefix) > -1 && hasField(fieldName))
                                            setFieldValue(fieldName, mapping[key]);
                                    });
                                });
                            }
                        }
                    },
                    focus: fieldItemFocus,
                    change: clearFieldIfNotFromList
                });

                var initialValue = $(this).val();
                if (initialValue && initialValue != "") {
                    console.log(initialValue);
                    $.ajax({
                        url: api_url + "/lookup/address",
                        data: {
                            query: initialValue,
                            city: hasField("city") ? getFieldValue("city") : null
                        },
                        success: function (t) {
                            if (t && t.result && t.result[0] && t.result[0].data) {
                                var d = t.result[0].data;
                                var mapping = {
                                    "setAddressCity": d.city,
                                    "setAddressKladr": d.kladr_id,
                                    "setAddressCityKladr": d.city_kladr_id,
                                    "setAddressStreet": d.street,
                                    "setAddressStreetType": d.street_type,
                                    "setAddressHouse": d.house,
                                    "setAddressBlock": d.block,
                                    "setAddressFlat": d.flat,
                                    "setPostalCode": d.postal_code
                                };
                                Object.keys(mapping).forEach(function (key) {
                                    fieldNamesByTag(key).forEach(function (fieldName) {
                                        if (mapping[key] && mapping[key] !== "" &&
                                            fieldName.indexOf(addressPrefix) > -1 && hasField(fieldName)) {
                                            setFieldValue(fieldName, mapping[key]);
                                        }
                                    });
                                });
                            }
                        }
                    })
                }
            });

            container.find("input[name='locationId'], .formio-lookup-location").ubeAutocomplete({
                source: function (t, e) {
                    $.ajax({
                        url: api_url + "/lookup/cities",
                        data: {
                            query: t.term
                        },
                        success: function (t) {
                            e(t.result.slice(0, 5))
                        }
                    })
                },
                select: function (t, e) {
                    t.preventDefault(), $(this).attr('data-value', e.item.value),
                        $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur")
                },
                focus: fieldItemFocus,
                change: clearFieldIfNotFromList
            }).each(function () {
                var field = $(this);
                var locationId = field.attr('data-value');
                var defaultCity = {value: 77000000000, label: "г. Москва"};

                function setLocationObject(result) {
                    field.attr('data-value', result.value).data('data-object', result).val(result.label).trigger("blur");
                    if(hasField("locationText")) setFieldValue("locationText", result.label);
                }

                if (locationId && locationId != "") {
                    $.ajax({
                        url: api_url + "/lookup/city?locationId=" + locationId,
                        success: function (t) {
                            if(t.result && t.result.value && t.result.label) {
                                field.attr('data-value', t.result.value).data('data-object', t.result).val(t.result.label).trigger("blur");
                                if (hasField("locationText")) setFieldValue("locationText", t.result.label);
                            }
                        }
                    });
                } else {
                    if (field.hasClass("noAutolookup")) return false;
                    $.ajax({
                        url: api_url + "/lookup/currentCity",
                        success: function (t) {
                            if (!t.result || !t.result.value || !t.result.label) {
                                setLocationObject(defaultCity);
                            }
                            else setLocationObject(t.result);
                        },
                        error: function () {
                            setLocationObject(defaultCity);
                        }
                    });
                }
            });

            function getBrandLabelForField(key) {
                return function() {
                    var field = $(this);
                    var brandId = field.attr('data-value');

                    if (brandId && brandId != "") {
                        $.ajax({
                            url: api_url + "/lookup/brands/" + brandId,
                            success: function (t) {
                                if (t.result && t.result.value && t.result.label) {
                                    form.find(".ube-label-" + key).html(t.result.label);
                                    field.attr('data-value', t.result.value).data('data-object', t.result).val(t.result.label).trigger("blur");
                                }
                            }
                        });
                    }
                }
            };

            function lookupBrand(key, pmi, families, focus) {
                var brandsInput = form.find("input[name='" + key + "'], .formio-lookup-" + key);
                var withSticks = brandsInput.attr('data-withSticks');
                var exceptBondstreet = brandsInput.attr('data-exceptBondstreet');

                withSticks = !!withSticks;
                exceptBondstreet = !!exceptBondstreet;

                pmi = pmi || "";
                var field = brandsInput.ubeAutocomplete({
                    position: {
                        my: "left top",
                        at: "left bottom",
                        collision: "none"
                    },
                    classes: {
                        "ui-autocomplete": "max-height"
                    },
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/brands",
                            data: {
                                query: t.term,
                                pmi: pmi,
                                families: families,
                                withSticks,
                                exceptBondstreet
                            },
                            success: function (t) {
                                const brands = t.result.map(function(item) {
                                    if(item.label.includes('NEXT/DUBLISS')) return {...item, label: item.label.replace('NEXT/DUBLISS', 'NEXT')}

                                    return item;
                                })

                                e(brands);
                            }
                        })
                    },
                    minLength: 0,
                    select: function (t, e) {
                        t.preventDefault(), $(this).attr('data-value', e.item.value),
                            form.find(".ube-label-" + key).html(e.item.label),
                            $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur")
                    },
                    focus: fieldItemFocus,
                    change: clearFieldIfNotFromList
                }).each(getBrandLabelForField(key));
                if (focus) {
                    field.focus(function () {
                        if (field[Object.keys(field)[0]].value.length == 0) {
                            $(this).autocomplete("search", "");
                        }
                    });
                }

            }

            function lookupFamily(key, onValueChange) {
                var field = form.find("input[name='" + key + "'], .formio-lookup-" + key).ubeAutocomplete({
                    position: {
                        my: "left top",
                        at: "left bottom",
                        collision: "none"
                    },
                    classes: {
                        "ui-autocomplete": "max-height"
                    },
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/brands/family",
                            data: {
                                query: t.term
                            },
                            success: function (t) {
                                e(t.result)
                            }
                        })
                    },
                    minLength: 0,
                    select: function (t, e) {
                        t.preventDefault(), $(this).attr('data-value', e.item.value),
                            form.find(".ube-label-" + key).html(e.item.label),
                            $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur");
                        if (onValueChange) onValueChange(e.item.value);
                    },
                    focus: fieldItemFocus,
                    change: clearFieldIfNotFromList
                }).each(getBrandLabelForField(key));
            }

            function lookupSku(key, familySourceField, searchOnClick) {
                var field = form.find("input[name='" + key + "'], .formio-lookup-" + key).ubeAutocomplete({
                    position: {
                        my: "left top",
                        at: "left bottom",
                        collision: "none"
                    },
                    classes: {
                        "ui-autocomplete": "max-height"
                    },
                    source: function (t, e) {
                        $.ajax({
                            url: api_url + "/lookup/brands/sku",
                            data: {
                                query: t.term,
                                familyId: familySourceField ? getFieldValue(familySourceField) : undefined
                            },
                            success: function (t) {
                                e(t.result)
                            }
                        })
                    },
                    minLength: 0,
                    select: function (t, e) {
                        t.preventDefault(), $(this).attr('data-value', e.item.value),
                            form.find(".ube-label-" + key).html(e.item.label),
                            $(this).data('data-object', e.item), $(this).val(e.item.label).trigger("blur")
                    },
                    focus: fieldItemFocus,
                    change: clearFieldIfNotFromList
                }).each(getBrandLabelForField(key));
                if (searchOnClick) {
                    field.focus(function () {
                        $(this).autocomplete("search", "");
                    });
                }

            }


            if (hasField('cigaretteBrand') && getField('cigaretteBrand').length > 0) {
                lookupFamily('cigaretteBrand', function (value) {
                    setFieldValue('cigaretteType', null);
                });
                lookupSku('cigaretteType', 'cigaretteBrand', true);
            } else
                lookupBrand('cigaretteType');

            if (url && ((url.indexOf("pone") > -1) || (url.indexOf("bondstreet-mbep-reg") > -1) || (url.includes('-bs-')))) lookupBrand('cigaretteTypeExt', true, true, true);
            else lookupBrand('cigaretteTypeExt');

            container.off("click", ".ube-trigger-event").on("click", ".ube-trigger-event", function (e) {
                e.preventDefault();
                if (isLoading) return false;
                var event = $(this).attr("data-ube-event");
                var repeat = $(this).attr("data-ube-repeat");
                var cabinetUrl = $(this).attr("data-cabinet-url") || "/personal/age-verification";
                const preferredMethod = ubeSession('preferredMethod');
                let action;

                if (event.includes('close') && isQRForm) {
                    const phoneTypeActions = {
                        telegram: 'click - button - change_phone - form - phone_telegram_push',
                        sms: 'click - button - change_phone - form - phone_sms_code',
                        flashingCall: 'click - button - change_phone - form - phone_call_code'
                    }

                    if (preferredMethod) {
                        action = phoneTypeActions[preferredMethod];
                    } else if (phoneConfirmationType) {
                        action = phoneTypeActions[phoneConfirmationType];
                    }

                    gaPush(`${categoryPrefix}phone_process`, action);
                } else if (name.endsWith('optin')) {
                    gaPush(categoryPrefix + "2optin_process", "click - button - back");
                } else if (name.includes('cabinet')) {
                    gaPush('dl_lk_profile', 'confirm - ' + event.split('-').slice(-1).join());
                }

                console.log("UBE :: Trigger event " + event);
                var data = initialValues;
                var formData = getFormData();
                if (event == "resendCode" || event == "resendPhoneCode" || event == "resendEmailCode") {
                    const category = isQRForm ? 'dl_qr_' : 'dl_auth_';
                    const phoneTypeActions = {
                        telegram: 'telegram_push - send_again - form - phone_telegram_push',
                        sms: 'sms_code - send_again - form - phone_sms_code',
                        flashingCall: 'call_code - send_again - form - phone_call_code'
                    }

                    if(remainingAttemptsCount) {
                        updatePhoneTypeActions(phoneTypeActions, ` - attempts_left: ${remainingAttemptsCount}`);
                    }

                    if (preferredMethod) {
                        action = phoneTypeActions[preferredMethod];
                    } else if (phoneConfirmationType) {
                        action = phoneTypeActions[phoneConfirmationType];
                    }

                    gaPush(`${category}phone_process`, action);
                    $.ajax({
                        url: api_url + "/resendCode",
                        headers: {"ube-session-key": sessionKey},
                        data: {
                            form: name,
                            entity: data.entity || name,
                            submissionId: data.submissionId,
                            profileId: formData.profileId,
                            event: event,
                            repeat: repeat
                        },
                        success: function (t) {
                            if (t.message) {
                                showPopup(t.message);

                                if($('.remaining-attempts-count').length) $('.remaining-attempts-count').text('');
                            }
                            else if (t.error) showPopup(t.error);
                            else {
                                console.error("UBE :: Resend code failed");
                                console.error(t)
                            }
                        }
                    });
                }
                else if(event === 'idxCheckAndTransferToAvForm')
                    $.ajax({
                        url: api_url + "/session/av/idx/personal",
                        method: 'post',
                        data: {
                            sessionKey
                        },
                        success: function (t) {
                            if (t.message === 'Возраст подтвержден') {
                                showPopup('Возраст подтвержден');
                                toggleLoader(true)
                                location.reload();
                                toggleLoader(false);
                            }
                            else location.pathname = cabinetUrl;
                        }
                    });
                else if (event.indexOf("social-login-") > -1) {
                    $(".ube-validation-message-show-for-social-login").hide();
                    toggleLoader(true);
                    var key = event.substring(13);
                    gaPush(categoryPrefix + "auth_social_start", `click - icon: ${key}`);
                    $.ajax({
                        url: api_url + "/auth/" + name + "/" + key + "/url",
                        headers: {
                            "Authorization": "Bearer " + sessionKey
                        }
                    }).done(function (data) {
                        window.location.href = data.authorizationUrl;
                    });
                }
                else if (event.indexOf("social-popup-login-") > -1) {
                    var key = event.substring(19);
                    gaPush("Social-Login", "Shop-Popup", key);
                    ubeOauth(key, sessionKey, name, api_url, function (value, result) {
                        if (result && result.socialId) {
                            setFieldValue("socialId", result.socialId);
                            setFieldValue("socialKey", key);
                        }

                        var entity = data.entity || name;

                        handleSocialLoginResult(result, entity);
                    })
                }
                else if (event.indexOf("social-set-") > -1) {
                    var key = event.substring(11);
                    gaPush("Social-Attach", "Shop-Popup", key);
                    var finalUrl = $(this).attr("data-ube-url");
                    ubeOauth(key, sessionKey, name, api_url, function (value) {
                        if (!value) return;
                        var field;
                        if (key === "vk") {
                            field = "vkontakte";
                            value = "id" + value;
                        }
                        else field = key;
                        if (key) setFieldValue(field, value);
                    }, finalUrl)
                }
                else if (event.indexOf("optin-cancel-") > -1) {
                    var key = event.substring(13);
                    if (["email", "phone", "cross", "personal"].indexOf(key) === -1) return console.error("Optin validation only available for phone and email fields, not for " + key);
                    setFieldValue(key + "CodeSent", false);
                    setFieldValue(key + "ValidatedValue", "");
                    setFieldValue(key + "CodeSentAt", null);
                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                    resetFieldValidation("submitted" + capitalize(key) + "Code");
                    handleFormVisibility();
                }
                else if (event.indexOf("optin-validate-") > -1) {
                    var key = event.substring(15);
                    if (["email", "phone", "cross", "personal"].indexOf(key) === -1) return console.error("Optin validation only available for phone and email fields, not for " + key);
                    resetFieldValidation("submitted" + capitalize(key) + "Code");

                    validateComponents(["firstName"], ["optinValidate"+capitalize(key)], () => validateComponent(key, function () {
                        var requestData = {
                            firstName: formData.firstName,
                            userId: formData.userId
                        };
                        requestData[key] = formData[key];
                        if (key === 'personal') {
                            requestData.profile = formData.profile;
                            requestData.lastName = formData.lastName;
                            requestData.gender = formData.gender;
                        }
                        toggleLoader(true);
                        $.ajax({
                            headers: {
                                "ga-id": ubeCookie('_ga') || "",
                                "d-id": ubeCookie('_d') || ""
                            },
                            url: host + "/esb/" + name + "/validate" + (sessionKey ? ("?sessionKey=" + sessionKey) : ""),
                            method: "post",
                            data: JSON.stringify(requestData),
                            contentType: 'application/json; charset=UTF-8',
                            success: function (t) {
                                toggleLoader(false);
                                if (t.sessionKey) sessionKey = t.sessionKey;
                                if (t.result) {
                                    if (getFieldValue(key + "ValidatedValue") !== getFieldValue(key)) setFieldValue("submitted" + capitalize(key) + "Code", null);
                                    setFieldValue(key + "CodeSent", true);
                                    setFieldValue(key + "ValidatedValue", formData[key]);
                                    setFieldValue(key + "CodeSentAt", new Date().getTime());
                                    var crossKey = "is" + capitalize(key) + "Cross";
                                    if(t.sessionData && hasField(crossKey)) setFieldValue(crossKey, t.sessionData[crossKey]);
                                    if(t.codeChannel && t.codeChannel === 'sms' && t.message && hasField('codeChannel')) {
                                        $('label[for="submittedPhoneCode"]').html('Введите код из SMS сообщения:<span style="color: red;">*</span>');
                                        window.toastr && window.toastr.success(t.message);
                                    }
                                    //TODO Временно убрана мгновенная валидация для тестирования в рамках https://jira.iqos.ru/browse/RRPEPA-566
                                    //validateComponent("submitted" + capitalize(key) + "Code");
                                    handleFormVisibility();
                                    getField(key).trigger("optin-started")
                                } else if(t.error) {
                                    showPopup(t.error);
                                    setFieldValue(key + "CodeSent", false);
                                    setFieldValue(key + "ValidatedValue", "");
                                    setFieldValue(key + "CodeSentAt", null);
                                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                                    handleFormVisibility();
                                } else if(t.fields && t.fields[key] && t.fields[key].result === false && t.fields[key].message) {
                                    setFieldValue(key + "CodeSent", false);
                                    setFieldValue(key + "ValidatedValue", "");
                                    setFieldValue(key + "CodeSentAt", null);
                                    setFieldValue("submitted" + capitalize(key) + "Code", null);
                                    setFieldInvalid(key, formData[key], t.fields[key].message)
                                }
                            }, error: function (xhr, resp, text) {
                                toggleLoader(false);
                                console.log("UBE :: Form submission ERROR");
                                console.log(xhr, resp, text);
                            }
                        });

                    }, function () {
                    }))
                }
                else if (options.onSubmissionSuccess) {
                    if(sessionKey) ubeCookie('ube_session_key', sessionKey, sessionExpiration())
                    options.onSubmissionSuccess(data.submissionId, data.userId, {
                        event: event,
                        data: {data: data, sessionKey: sessionKey}
                    });
                }
                e.preventDefault();
            });
            $(document).on("mousedown", '.popup-block-age-verification a', function() {
                var event = $(this).attr("data-ube-event");
                var cabinetUrl = $(this).attr("data-cabinet-url") || "/personal/age-verification";

                if(event === 'idxCheckAndTransferToAvForm')
                    $.ajax({
                        url: api_url + "/session/av/idx/personal",
                        method: 'post',
                        data: {
                            sessionKey
                        },
                        success: function (t) {
                            if (t.message === 'Возраст подтвержден') {
                                showPopup('Возраст подтвержден');
                                toggleLoader(true)
                                location.reload();
                                toggleLoader(false);
                            }
                            else location.pathname = cabinetUrl;
                        }
                    });
            })

            form.ubeTraverseEnter();

            if (isWizard) {
                var currentStepIndex = 0;
                var panels = json.components.filter(function (c) {
                    return c['type'] == "panel"
                });
                var panelKeys = panels.map(function (c) {
                    return c.key
                });
                var stepCount = panels.length;

                if (isMBEPForm) {
                    gaPush('dl_av_idx_registration_start', 'form - idx_reg');
                }

                var changeStep = function (delta, b, e) {
                    var newStepIndex = currentStepIndex + delta;
                    if(isMBEPForm && newStepIndex === 1 && currentStepIndex === 0) {
                        gaPush('dl_av_idx_registration_process', 'send - form - idx_reg');
                        gaPush('dl_av_idx_registration_success', 'form - idx_reg');
                        gaPush('dl_auth_registration_start', 'form - registration');
                    }
                    if (newStepIndex >= stepCount) {
                        form.submit();
                    } else if (newStepIndex >= 0) {
                        var key = panelKeys[currentStepIndex];
                        var callbackAfterValidation = function () {
                            if (options.onStepChange)
                                options.onStepChange(newStepIndex, currentStepIndex, b, e);
                            else {
                                var newKey = panelKeys[newStepIndex];
                                toggleVisible(key, false);
                                toggleVisible(newKey, true);
                            }
                            currentStepIndex = newStepIndex;
                        };
                        if (delta > 0) validateAllFields(callbackAfterValidation, null, appendChildrenKeys(key));
                        else callbackAfterValidation();
                    }
                };

                var handleStepClick = function (delta) {
                    return function (e) {
                        changeStep(delta, $(this), e);
                        e.preventDefault();
                        return false;
                    }
                }

                form.find(".ube-wizard-next").click(handleStepClick(1));
                form.find(".ube-wizard-prev").click(handleStepClick(-1));
                container.add(form).on("ubeNext", handleStepClick(1)).on("ubePrev", handleStepClick(-1));
            }

            container.data('ube', {
                appendChildrenKeys: appendChildrenKeys,
                validateAllFields: validateAllFields,
                validateComponent: validateComponent,
                sessionKey: sessionKey
            });

            /**
             * Выключение стандартного browser autocomplete
             */
            container.find("[autocomplete='off'], [autocomplete='false'], [autocomplete='disabled'], [autocomplete='no']").disableBrowserAutocomplete();

            form.trigger("formLoaded");

            if(!captchaBypass) {
                if (container.find(".g-recaptcha").length > 0) {
                    initFormCaptcha(container, 'google');
                } else if(captchaType === 'google' && formProperties.grecaptcha && formProperties.grecaptcha.length > 0) {
                    form.append('<div class="g-recaptcha" data-sitekey="'+formProperties.grecaptcha+'" data-size="invisible"></div>');
                    initFormCaptcha(container, captchaType);
                } else if(captchaType === 'yandex' && formProperties.grecaptcha && formProperties.grecaptcha.length > 0) {
                    sessionStorage.setItem('sitekey', formProperties.grecaptcha);
                    form.append(`<div class="yandex-captcha"></div>`);
                    initFormCaptcha(container, captchaType);
                } else container.removeAttr("withReCaptcha");
            }

            if (!captchaV3Initialized && location.hostname.match(captchaV3Domains)) {
                initFormCaptchaV3();
                captchaV3Initialized = true;
            }

            if (options.onFormLoad) options.onFormLoad(json?.properties);
        };
        var template_url = options.template || "";

        if (template_url.length == 0 && ((!/retail/.test(name) && /-(idx|reg|optin|av|login|remind|cabinet|phone|phone-send|phone-check)$/.test(name)) || container.is(':empty')))
            template_url = host + "/template/" + name;

        const isTemplatePreloaded = options.isTemplatePreloaded && !isNoPreload(name);

        if (!isTemplatePreloaded && template_url.length > 0 && !(/(retail)/.test(template_url) && !container.is(':empty')))
            container.empty().append(json.template);

        handle_form();
    }
    const updatedUrl = url.replace('/main/', '/form/').replace('/template/', '/form/');
    if (sessionKey && options.loadFormDataFromSession !== false) {
        $.when(
            $.ajax({
                url: updatedUrl,
                type: "GET",
            }),
            $.ajax({
                url: getSessionUrl,
                type: "GET",
                headers: { "Authorization": "Bearer " + sessionKey }
            })
        ).then(function (json, sessionData) {
            setVariablesFromSource(sessionData[0]);
            initializeFormByConfig(json[0]).catch(handleAjaxFail);
            if (sessionData && sessionData.error && options.onSessionError) options.onSessionError(sessionData.error, sessionKey);
        });
    }
    else if (options.formDefinitionJson)
        initializeFormByConfig(options.formDefinitionJson).catch(handleAjaxFail);
    else {
        $.getJSON(updatedUrl).done(json => initializeFormByConfig(json).catch(handleAjaxFail)).fail(handleAjaxFail);
    }

    return this;

};

function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

/**
 * Verifies that redirect url belongs to same domain
 * @param {string} redirectUrl
 * @return {boolean}
 */
function verifyRedirectSameDomain(redirectUrl) {
    if(!redirectUrl || redirectUrl === "") return true;
    const currentHostname = (window.location.hostname || "") + "";
    if(!currentHostname) return true;
    try {
        const url = new URL(redirectUrl);
        const redirectHostname = (url.hostname || "") + "";
        if(redirectHostname !== currentHostname) {
            console.error("Redirect URL: '"+redirectUrl+"', hostname: '"+url.hostname+"', current hostname: '"+currentHostname+"'");
        }
        return redirectHostname === currentHostname;
    } catch (e) {

    }
    return true
}

$(document).ready(function () {
    function checkUtm() {
        var query = getJsonFromUrl();
        if(query.utm_content) ubeSession("utmContent", query.utm_content);
        if(query.utm_campaign) ubeSession("utmCampaign", query.utm_campaign);
        if(query.utm_source) ubeSession("utmSource", query.utm_source);
        if(query.utm_medium) ubeSession("utmMedium", query.utm_medium);
    }

    function checkCookiePolicy() {
        if (ubeCookie(_COOKIE_POLICY)) return;
        ubeHostFallBack();
        var host = encodeURIComponent(window.location.hostname);
        var path = encodeURIComponent(window.location.pathname);

        var rand = "" + new Date().getTime();
        ubeCookie(_COOKIE_CHECK, rand);
        if (ubeCookie(_COOKIE_CHECK) != rand) return;
        ubeCookie(_COOKIE_CHECK, null);

        $.get($.ube.host + "/api/cookie/popup?host=" + host + "&path=" + path)
            .done(function (result) {
                if (result && result.showCookie && result.template) {
                    var popup = $(result.template);
                    popup.hide().appendTo($("body")).not("script, style").fadeIn(400);
                    $(".cookie-confirm-button").click(function () {
                        ubeCookie(_COOKIE_POLICY, "CONFIRMED");
                        $.get($.ube.host + "/api/cookie/track?host=" + host + "&path=" + path);
                        setTimeout(function () {
                            popup.not("script, style").fadeOut(400);
                        }, 1000);
                        gaPush("UBE-Cookie", "Agree");
                    });
                    gaPush("UBE-Cookie", "Show");
                } else {
                    /**
                     * Disable cookie check for 1 day. Possible cookie will be switched on for domain
                     * @type {Date}
                     */
                    var tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
                    ubeCookie(_COOKIE_POLICY, "DOMAIN_DISABLED", tomorrow.toUTCString());
                }
            });

    }

    function init() {
        oneTrustInit() || checkCookiePolicy();
        checkUtm();
    }

    window.setTimeout(init, 100);

    ubeHostFallBack();
    initWidgets();
});
