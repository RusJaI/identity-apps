/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
    AuthenticatedUserInfo,
    BasicUserInfo,
    Hooks,
    OIDCEndpoints,
    SPAUtils,
    SecureApp,
    useAuthContext
} from "@asgardeo/auth-react";
import { AppConstants as CommonAppConstants } from "@wso2is/core/constants";
import { TenantListInterface } from "@wso2is/core/models";
import { setSignIn } from "@wso2is/core/store";
import { AuthenticateUtils as CommonAuthenticateUtils, ContextUtils } from "@wso2is/core/utils";
import axios from "axios";
import React, { FunctionComponent, ReactElement, lazy, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AuthenticateUtils, getProfileInformation } from "./features/authentication";
import { Config, HttpUtils, PreLoader } from "./features/core";
import { AppConstants, CommonConstants } from "./features/core/constants";
import { history } from "./features/core/helpers";

const AUTHORIZATION_ENDPOINT = "authorization_endpoint";
const TOKEN_ENDPOINT = "token_endpoint";
const OIDC_SESSION_IFRAME_ENDPOINT = "oidc_session_iframe_endpoint";
const LOGOUT_URL = "sign_out_url";

const App = lazy(() => import("./app"));
export const ProtectedApp: FunctionComponent<Record<string, never>> = (): ReactElement => {

    const {
        signIn,
        on,
        getDecodedIDToken,
        getOIDCServiceEndpoints
    } = useAuthContext();

    const dispatch = useDispatch();

    useEffect(() => {
        on(Hooks.HttpRequestError, HttpUtils.onHttpRequestError);
        on(Hooks.HttpRequestFinish, HttpUtils.onHttpRequestFinish);
        on(Hooks.HttpRequestStart, HttpUtils.onHttpRequestStart);
        on(Hooks.HttpRequestSuccess, HttpUtils.onHttpRequestSuccess);

        on(Hooks.SignIn, (response: BasicUserInfo) => {
            // Update the app base name with the newly resolved tenant.
            window[ "AppUtils" ].updateTenantQualifiedBaseName(response.tenantDomain);

            // When the tenant domain changes, we have to reset the auth callback in session storage.
            // If not, it will hang and the app will be unresponsive with in the tab.
            // We can skip clearing the callback for super tenant since we do not put it in the path.
            if (response.tenantDomain !== AppConstants.getSuperTenant()) {
                // If the auth callback already has the logged in tenant's path, we can skip the reset.
                if (
                    !CommonAuthenticateUtils.isValidAuthenticationCallbackUrl(
                        CommonAppConstants.CONSOLE_APP,
                        AppConstants.getTenantPath()
                    )
                ) {
                    CommonAuthenticateUtils.removeAuthenticationCallbackUrl(CommonAppConstants.CONSOLE_APP);
                }
            }

            // Update the context with new config once the basename is changed.
            ContextUtils.setRuntimeConfig(Config.getDeploymentConfig());

            // Update post_logout_redirect_uri of logout_url with tenant qualified url
            if (sessionStorage.getItem(LOGOUT_URL)) {
                let logoutUrl = sessionStorage.getItem(LOGOUT_URL);

                if (!window[ "AppUtils" ].getConfig().accountApp.commonPostLogoutUrl) {
                    // If there is a base name, replace the `post_logout_redirect_uri` with the tenanted base name.
                    if (window[ "AppUtils" ].getConfig().appBase) {
                        logoutUrl = logoutUrl.replace(
                            window[ "AppUtils" ].getAppBase(),
                            window[ "AppUtils" ].getAppBaseWithTenant()
                        );
                    } else {
                        logoutUrl = logoutUrl.replace(
                            window[ "AppUtils" ].getConfig().logoutCallbackURL,
                            window[ "AppUtils" ].getConfig().clientOrigin
                            + window[ "AppUtils" ].getConfig().routes.login
                        );
                    }
                }

                // If an override URL is defined in config, use that instead.
                if (window[ "AppUtils" ].getConfig().idpConfigs?.logoutEndpointURL) {
                    logoutUrl = AuthenticateUtils.resolveIdpURLSAfterTenantResolves(
                        logoutUrl,
                        window[ "AppUtils" ].getConfig().idpConfigs.logoutEndpointURL
                    );
                }

                sessionStorage.setItem(LOGOUT_URL, logoutUrl);
            }

            getDecodedIDToken()
                .then((idToken) => {
                    const subParts = idToken.sub.split("@");
                    const tenantDomain = subParts[ subParts.length - 1 ];

                    dispatch(
                        setSignIn<AuthenticatedUserInfo & TenantListInterface>({
                            allowedScopes: response.allowedScopes,
                            associatedTenants: idToken?.associated_tenants,
                            defaultTenant: idToken?.default_tenant,
                            displayName: response.displayName,
                            display_name: response.displayName,
                            email: response.email,
                            tenantDomain: response.tenantDomain ?? tenantDomain,
                            username: response.username
                        })
                    );
                })
                .catch((error) => {
                    throw error;
                });

            sessionStorage.setItem(CommonConstants.SESSION_STATE, response?.sessionState);

            getOIDCServiceEndpoints()
                .then((response: OIDCEndpoints) => {
                    let authorizationEndpoint: string = response.authorizationEndpoint;
                    let oidcSessionIframeEndpoint: string = response.checkSessionIframe;
                    let tokenEndpoint: string = response.tokenEndpoint;

                    // If `authorize` endpoint is overridden, save that in the session.
                    if (window[ "AppUtils" ].getConfig().idpConfigs?.authorizeEndpointURL) {
                        authorizationEndpoint = AuthenticateUtils.resolveIdpURLSAfterTenantResolves(
                            authorizationEndpoint,
                            window[ "AppUtils" ].getConfig().idpConfigs.authorizeEndpointURL
                        );
                    }

                    // If `oidc session iframe` endpoint is overridden, save that in the session.
                    if (window[ "AppUtils" ].getConfig().idpConfigs?.oidcSessionIFrameEndpointURL) {
                        oidcSessionIframeEndpoint = AuthenticateUtils.resolveIdpURLSAfterTenantResolves(
                            oidcSessionIframeEndpoint,
                            window[ "AppUtils" ].getConfig().idpConfigs.oidcSessionIFrameEndpointURL
                        );
                    }

                    // If `token` endpoint is overridden, save that in the session.
                    if (window[ "AppUtils" ].getConfig().idpConfigs?.tokenEndpointURL) {
                        tokenEndpoint = AuthenticateUtils.resolveIdpURLSAfterTenantResolves(
                            tokenEndpoint,
                            window[ "AppUtils" ].getConfig().idpConfigs.tokenEndpointURL
                        );
                    }

                    sessionStorage.setItem(AUTHORIZATION_ENDPOINT, authorizationEndpoint);
                    sessionStorage.setItem(OIDC_SESSION_IFRAME_ENDPOINT, oidcSessionIframeEndpoint);
                    sessionStorage.setItem(TOKEN_ENDPOINT, tokenEndpoint);
                })
                .catch((error) => {
                    throw error;
                });

            dispatch(
                getProfileInformation(
                    Config.getServiceResourceEndpoints().me,
                    window[ "AppUtils" ].getConfig().clientOriginWithTenant
                )
            );
        });
    }, []);

    const loginSuccessRedirect = (): void  => {
        const AuthenticationCallbackUrl = CommonAuthenticateUtils.getAuthenticationCallbackUrl(
            CommonAppConstants.CONSOLE_APP
        );

        const location =
            !AuthenticationCallbackUrl || AuthenticationCallbackUrl === AppConstants.getAppLoginPath()
                ? AppConstants.getAppHomePath()
                : AuthenticationCallbackUrl;

        history.push(location);
    };

    useEffect(() => {
        const error = new URLSearchParams(location.search).get("error_description");
        if (error === AppConstants.USER_DENIED_CONSENT_SERVER_ERROR) {
            history.push({
                pathname: AppConstants.getPaths().get("UNAUTHORIZED"),
                search: "?error=" + AppConstants.LOGIN_ERRORS.get("USER_DENIED_CONSENT")
            });

            return;
        }
    }, []);

    return (
        <SecureApp
            fallback={ <PreLoader /> }
            onSignIn={ loginSuccessRedirect }
            overrideSignIn={
                async () => {
                    if (SPAUtils.hasAuthSearchParamsInURL() || process.env.NODE_ENV !== "production") {
                        await signIn();
                    } else {
                        const contextPath: string = window[ "AppUtils" ].getConfig().appBase
                            ? `/${ window[ "AppUtils" ].getConfig().appBase }`
                            : "";

                        await axios.get(contextPath + "/auth").then((response) => {
                            signIn(null, response?.data?.authCode, response?.data?.sessionState);
                        });
                    }
                }
            }
        >
            <App />
        </SecureApp>
    );
};
