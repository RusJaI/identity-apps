/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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

import Grid from "@oxygen-ui/react/Grid";
import { Hint } from "@wso2is/react-components";
import React, { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { InsightsGraph } from "./insight-graph";
import { ResourceType } from "../models/insights";

export const SignupInsights: FunctionComponent = () => {
    const { t } = useTranslation();
    
    return (
        <Grid container spacing={ 2 }>
            <Grid xs={ 12 }>
                <InsightsGraph
                    hint={ (
                        <Hint icon="question circle" popup inline className="org-insights-mau-tooltip">
                            { t("console:manage.features.insights.graphs.signups.titleHint") }
                        </Hint>
                    ) }
                    graphTitle={ t("console:manage.features.insights.graphs.signups.title") }
                    resourceType={ ResourceType.USER_REGISTRATION }
                    data-componentid="org-insights-signup-graph"
                />
            </Grid>
        </Grid>
    );
};
