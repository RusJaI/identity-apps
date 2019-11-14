/**
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Grid, Header } from "semantic-ui-react";
import { Application } from "../../models";
import { ApplicationList } from "./application-list";

/**
 * Proptypes for the all applications component.
 */
interface AllApplicationsProps {
    allApps: Application[];
}

/**
 * All applications component.
 *
 * @return {JSX.Element}
 */
export const AllApplications: FunctionComponent<AllApplicationsProps> = (
    props: AllApplicationsProps
): JSX.Element => {
    const { allApps } = props;
    const { t } = useTranslation();

    return (
        <>
            <Divider hidden />
            <Grid>
                <Grid.Row columns={ 2 }>
                    <Grid.Column width={ 12 }>
                        <Header as="h2">{ t("views:components.applications.all.heading") }</Header>
                    </Grid.Column>
                    <Grid.Column width={ 4 }>
                        <Button className="link-button" floated="right">Show all</Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Divider hidden />
            <ApplicationList apps={ allApps } isFavouritesList={ false } />
        </>
    );
};
