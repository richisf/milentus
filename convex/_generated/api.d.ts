/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as githubAccount_action_create from "../githubAccount/action/create.js";
import type * as githubAccount_action_services_exchange from "../githubAccount/action/services/exchange.js";
import type * as githubAccount_action_services_fetch from "../githubAccount/action/services/fetch.js";
import type * as githubAccount_mutation_create from "../githubAccount/mutation/create.js";
import type * as githubAccount_mutation_remove from "../githubAccount/mutation/remove.js";
import type * as githubAccount_query_by_user from "../githubAccount/query/by_user.js";
import type * as githubAccount_repository_action_create_default from "../githubAccount/repository/action/create/default.js";
import type * as githubAccount_repository_action_create_nonDefault from "../githubAccount/repository/action/create/nonDefault.js";
import type * as githubAccount_repository_action_create from "../githubAccount/repository/action/create.js";
import type * as githubAccount_repository_action_remove from "../githubAccount/repository/action/remove.js";
import type * as githubAccount_repository_action_services_create from "../githubAccount/repository/action/services/create.js";
import type * as githubAccount_repository_action_services_delete from "../githubAccount/repository/action/services/delete.js";
import type * as githubAccount_repository_action_services_fetch_repositories from "../githubAccount/repository/action/services/fetch/repositories.js";
import type * as githubAccount_repository_action_services_fetch_repository from "../githubAccount/repository/action/services/fetch/repository.js";
import type * as githubAccount_repository_document_action_create from "../githubAccount/repository/document/action/create.js";
import type * as githubAccount_repository_document_action_services_response from "../githubAccount/repository/document/action/services/response.js";
import type * as githubAccount_repository_document_mutation_create from "../githubAccount/repository/document/mutation/create.js";
import type * as githubAccount_repository_document_query_by_repository from "../githubAccount/repository/document/query/by_repository.js";
import type * as githubAccount_repository_machine_action_create from "../githubAccount/repository/machine/action/create.js";
import type * as githubAccount_repository_machine_action_remove from "../githubAccount/repository/machine/action/remove.js";
import type * as githubAccount_repository_machine_action_services_create_devServer_convexProject from "../githubAccount/repository/machine/action/services/create/devServer/convexProject.js";
import type * as githubAccount_repository_machine_action_services_create_devServer_envManager from "../githubAccount/repository/machine/action/services/create/devServer/envManager.js";
import type * as githubAccount_repository_machine_action_services_create_devServer_nextjsConfig from "../githubAccount/repository/machine/action/services/create/devServer/nextjsConfig.js";
import type * as githubAccount_repository_machine_action_services_create_devServer_packageManager from "../githubAccount/repository/machine/action/services/create/devServer/packageManager.js";
import type * as githubAccount_repository_machine_action_services_create_devServer_pm2Manager from "../githubAccount/repository/machine/action/services/create/devServer/pm2Manager.js";
import type * as githubAccount_repository_machine_action_services_create_devServer from "../githubAccount/repository/machine/action/services/create/devServer.js";
import type * as githubAccount_repository_machine_action_services_create_dns from "../githubAccount/repository/machine/action/services/create/dns.js";
import type * as githubAccount_repository_machine_action_services_create_machine from "../githubAccount/repository/machine/action/services/create/machine.js";
import type * as githubAccount_repository_machine_action_services_create_repository from "../githubAccount/repository/machine/action/services/create/repository.js";
import type * as githubAccount_repository_machine_action_services_create_setupSystem from "../githubAccount/repository/machine/action/services/create/setupSystem.js";
import type * as githubAccount_repository_machine_action_services_create_ssl_siteConfig from "../githubAccount/repository/machine/action/services/create/ssl/siteConfig.js";
import type * as githubAccount_repository_machine_action_services_create_ssl_websocket from "../githubAccount/repository/machine/action/services/create/ssl/websocket.js";
import type * as githubAccount_repository_machine_action_services_create_ssl from "../githubAccount/repository/machine/action/services/create/ssl.js";
import type * as githubAccount_repository_machine_action_services_create from "../githubAccount/repository/machine/action/services/create.js";
import type * as githubAccount_repository_machine_action_services_remove_convexProject from "../githubAccount/repository/machine/action/services/remove/convexProject.js";
import type * as githubAccount_repository_machine_action_services_remove_dns from "../githubAccount/repository/machine/action/services/remove/dns.js";
import type * as githubAccount_repository_machine_action_services_remove_machine from "../githubAccount/repository/machine/action/services/remove/machine.js";
import type * as githubAccount_repository_machine_action_services_update_machine from "../githubAccount/repository/machine/action/services/update/machine.js";
import type * as githubAccount_repository_machine_action_services_update_resume from "../githubAccount/repository/machine/action/services/update/resume.js";
import type * as githubAccount_repository_machine_action_services_update_suspend from "../githubAccount/repository/machine/action/services/update/suspend.js";
import type * as githubAccount_repository_machine_action_services_update from "../githubAccount/repository/machine/action/services/update.js";
import type * as githubAccount_repository_machine_action_update from "../githubAccount/repository/machine/action/update.js";
import type * as githubAccount_repository_machine_conversation_message_action_create from "../githubAccount/repository/machine/conversation/message/action/create.js";
import type * as githubAccount_repository_machine_conversation_message_action_services_execute from "../githubAccount/repository/machine/conversation/message/action/services/execute.js";
import type * as githubAccount_repository_machine_mutation_create from "../githubAccount/repository/machine/mutation/create.js";
import type * as githubAccount_repository_machine_mutation_remove from "../githubAccount/repository/machine/mutation/remove.js";
import type * as githubAccount_repository_machine_mutation_update from "../githubAccount/repository/machine/mutation/update.js";
import type * as githubAccount_repository_machine_query_by_repository from "../githubAccount/repository/machine/query/by_repository.js";
import type * as githubAccount_repository_mutation_create from "../githubAccount/repository/mutation/create.js";
import type * as githubAccount_repository_mutation_remove from "../githubAccount/repository/mutation/remove.js";
import type * as githubAccount_repository_query_by_id from "../githubAccount/repository/query/by_id.js";
import type * as githubAccount_repository_query_by_user from "../githubAccount/repository/query/by_user.js";
import type * as githubAccount_repository_query_by_user_name from "../githubAccount/repository/query/by_user_name.js";
import type * as http from "../http.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "githubAccount/action/create": typeof githubAccount_action_create;
  "githubAccount/action/services/exchange": typeof githubAccount_action_services_exchange;
  "githubAccount/action/services/fetch": typeof githubAccount_action_services_fetch;
  "githubAccount/mutation/create": typeof githubAccount_mutation_create;
  "githubAccount/mutation/remove": typeof githubAccount_mutation_remove;
  "githubAccount/query/by_user": typeof githubAccount_query_by_user;
  "githubAccount/repository/action/create/default": typeof githubAccount_repository_action_create_default;
  "githubAccount/repository/action/create/nonDefault": typeof githubAccount_repository_action_create_nonDefault;
  "githubAccount/repository/action/create": typeof githubAccount_repository_action_create;
  "githubAccount/repository/action/remove": typeof githubAccount_repository_action_remove;
  "githubAccount/repository/action/services/create": typeof githubAccount_repository_action_services_create;
  "githubAccount/repository/action/services/delete": typeof githubAccount_repository_action_services_delete;
  "githubAccount/repository/action/services/fetch/repositories": typeof githubAccount_repository_action_services_fetch_repositories;
  "githubAccount/repository/action/services/fetch/repository": typeof githubAccount_repository_action_services_fetch_repository;
  "githubAccount/repository/document/action/create": typeof githubAccount_repository_document_action_create;
  "githubAccount/repository/document/action/services/response": typeof githubAccount_repository_document_action_services_response;
  "githubAccount/repository/document/mutation/create": typeof githubAccount_repository_document_mutation_create;
  "githubAccount/repository/document/query/by_repository": typeof githubAccount_repository_document_query_by_repository;
  "githubAccount/repository/machine/action/create": typeof githubAccount_repository_machine_action_create;
  "githubAccount/repository/machine/action/remove": typeof githubAccount_repository_machine_action_remove;
  "githubAccount/repository/machine/action/services/create/devServer/convexProject": typeof githubAccount_repository_machine_action_services_create_devServer_convexProject;
  "githubAccount/repository/machine/action/services/create/devServer/envManager": typeof githubAccount_repository_machine_action_services_create_devServer_envManager;
  "githubAccount/repository/machine/action/services/create/devServer/nextjsConfig": typeof githubAccount_repository_machine_action_services_create_devServer_nextjsConfig;
  "githubAccount/repository/machine/action/services/create/devServer/packageManager": typeof githubAccount_repository_machine_action_services_create_devServer_packageManager;
  "githubAccount/repository/machine/action/services/create/devServer/pm2Manager": typeof githubAccount_repository_machine_action_services_create_devServer_pm2Manager;
  "githubAccount/repository/machine/action/services/create/devServer": typeof githubAccount_repository_machine_action_services_create_devServer;
  "githubAccount/repository/machine/action/services/create/dns": typeof githubAccount_repository_machine_action_services_create_dns;
  "githubAccount/repository/machine/action/services/create/machine": typeof githubAccount_repository_machine_action_services_create_machine;
  "githubAccount/repository/machine/action/services/create/repository": typeof githubAccount_repository_machine_action_services_create_repository;
  "githubAccount/repository/machine/action/services/create/setupSystem": typeof githubAccount_repository_machine_action_services_create_setupSystem;
  "githubAccount/repository/machine/action/services/create/ssl/siteConfig": typeof githubAccount_repository_machine_action_services_create_ssl_siteConfig;
  "githubAccount/repository/machine/action/services/create/ssl/websocket": typeof githubAccount_repository_machine_action_services_create_ssl_websocket;
  "githubAccount/repository/machine/action/services/create/ssl": typeof githubAccount_repository_machine_action_services_create_ssl;
  "githubAccount/repository/machine/action/services/create": typeof githubAccount_repository_machine_action_services_create;
  "githubAccount/repository/machine/action/services/remove/convexProject": typeof githubAccount_repository_machine_action_services_remove_convexProject;
  "githubAccount/repository/machine/action/services/remove/dns": typeof githubAccount_repository_machine_action_services_remove_dns;
  "githubAccount/repository/machine/action/services/remove/machine": typeof githubAccount_repository_machine_action_services_remove_machine;
  "githubAccount/repository/machine/action/services/update/machine": typeof githubAccount_repository_machine_action_services_update_machine;
  "githubAccount/repository/machine/action/services/update/resume": typeof githubAccount_repository_machine_action_services_update_resume;
  "githubAccount/repository/machine/action/services/update/suspend": typeof githubAccount_repository_machine_action_services_update_suspend;
  "githubAccount/repository/machine/action/services/update": typeof githubAccount_repository_machine_action_services_update;
  "githubAccount/repository/machine/action/update": typeof githubAccount_repository_machine_action_update;
  "githubAccount/repository/machine/conversation/message/action/create": typeof githubAccount_repository_machine_conversation_message_action_create;
  "githubAccount/repository/machine/conversation/message/action/services/execute": typeof githubAccount_repository_machine_conversation_message_action_services_execute;
  "githubAccount/repository/machine/mutation/create": typeof githubAccount_repository_machine_mutation_create;
  "githubAccount/repository/machine/mutation/remove": typeof githubAccount_repository_machine_mutation_remove;
  "githubAccount/repository/machine/mutation/update": typeof githubAccount_repository_machine_mutation_update;
  "githubAccount/repository/machine/query/by_repository": typeof githubAccount_repository_machine_query_by_repository;
  "githubAccount/repository/mutation/create": typeof githubAccount_repository_mutation_create;
  "githubAccount/repository/mutation/remove": typeof githubAccount_repository_mutation_remove;
  "githubAccount/repository/query/by_id": typeof githubAccount_repository_query_by_id;
  "githubAccount/repository/query/by_user": typeof githubAccount_repository_query_by_user;
  "githubAccount/repository/query/by_user_name": typeof githubAccount_repository_query_by_user_name;
  http: typeof http;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
