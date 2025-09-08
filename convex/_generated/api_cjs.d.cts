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
import type * as githubAccount_action_services_create_exchange from "../githubAccount/action/services/create/exchange.js";
import type * as githubAccount_action_services_create_fetch from "../githubAccount/action/services/create/fetch.js";
import type * as githubAccount_action_services_create from "../githubAccount/action/services/create.js";
import type * as githubAccount_application_action_create from "../githubAccount/application/action/create.js";
import type * as githubAccount_application_action_delete from "../githubAccount/application/action/delete.js";
import type * as githubAccount_application_action_services_create from "../githubAccount/application/action/services/create.js";
import type * as githubAccount_application_action_services_delete from "../githubAccount/application/action/services/delete.js";
import type * as githubAccount_application_document_action_create from "../githubAccount/application/document/action/create.js";
import type * as githubAccount_application_document_action_delete from "../githubAccount/application/document/action/delete.js";
import type * as githubAccount_application_document_action_update_files from "../githubAccount/application/document/action/update/files.js";
import type * as githubAccount_application_document_action_update_services_files_system from "../githubAccount/application/document/action/update/services/files/system.js";
import type * as githubAccount_application_document_action_update_services_files from "../githubAccount/application/document/action/update/services/files.js";
import type * as githubAccount_application_document_action_update_services_response from "../githubAccount/application/document/action/update/services/response.js";
import type * as githubAccount_application_document_action_update from "../githubAccount/application/document/action/update.js";
import type * as githubAccount_application_document_conversation_action_create from "../githubAccount/application/document/conversation/action/create.js";
import type * as githubAccount_application_document_conversation_action_update from "../githubAccount/application/document/conversation/action/update.js";
import type * as githubAccount_application_document_conversation_message_action_create from "../githubAccount/application/document/conversation/message/action/create.js";
import type * as githubAccount_application_document_conversation_message_action_services_configuration_system from "../githubAccount/application/document/conversation/message/action/services/configuration/system.js";
import type * as githubAccount_application_document_conversation_message_action_services_create from "../githubAccount/application/document/conversation/message/action/services/create.js";
import type * as githubAccount_application_document_conversation_message_mutation_create from "../githubAccount/application/document/conversation/message/mutation/create.js";
import type * as githubAccount_application_document_conversation_message_mutation_delete from "../githubAccount/application/document/conversation/message/mutation/delete.js";
import type * as githubAccount_application_document_conversation_message_query_by_conversation from "../githubAccount/application/document/conversation/message/query/by_conversation.js";
import type * as githubAccount_application_document_conversation_mutation_create from "../githubAccount/application/document/conversation/mutation/create.js";
import type * as githubAccount_application_document_conversation_mutation_update from "../githubAccount/application/document/conversation/mutation/update.js";
import type * as githubAccount_application_document_conversation_query_by_document from "../githubAccount/application/document/conversation/query/by_document.js";
import type * as githubAccount_application_document_mutation_create from "../githubAccount/application/document/mutation/create.js";
import type * as githubAccount_application_document_mutation_delete from "../githubAccount/application/document/mutation/delete.js";
import type * as githubAccount_application_document_mutation_update from "../githubAccount/application/document/mutation/update.js";
import type * as githubAccount_application_document_query_by_application from "../githubAccount/application/document/query/by_application.js";
import type * as githubAccount_application_document_query_by_id from "../githubAccount/application/document/query/by_id.js";
import type * as githubAccount_application_machine_action_create from "../githubAccount/application/machine/action/create.js";
import type * as githubAccount_application_machine_action_delete from "../githubAccount/application/machine/action/delete.js";
import type * as githubAccount_application_machine_action_services_create_devServer_convexProject from "../githubAccount/application/machine/action/services/create/devServer/convexProject.js";
import type * as githubAccount_application_machine_action_services_create_devServer_envManager from "../githubAccount/application/machine/action/services/create/devServer/envManager.js";
import type * as githubAccount_application_machine_action_services_create_devServer_nextjsConfig from "../githubAccount/application/machine/action/services/create/devServer/nextjsConfig.js";
import type * as githubAccount_application_machine_action_services_create_devServer_packageManager from "../githubAccount/application/machine/action/services/create/devServer/packageManager.js";
import type * as githubAccount_application_machine_action_services_create_devServer_pm2Manager from "../githubAccount/application/machine/action/services/create/devServer/pm2Manager.js";
import type * as githubAccount_application_machine_action_services_create_devServer from "../githubAccount/application/machine/action/services/create/devServer.js";
import type * as githubAccount_application_machine_action_services_create_dns from "../githubAccount/application/machine/action/services/create/dns.js";
import type * as githubAccount_application_machine_action_services_create_machine from "../githubAccount/application/machine/action/services/create/machine.js";
import type * as githubAccount_application_machine_action_services_create_repository from "../githubAccount/application/machine/action/services/create/repository.js";
import type * as githubAccount_application_machine_action_services_create_setupSystem from "../githubAccount/application/machine/action/services/create/setupSystem.js";
import type * as githubAccount_application_machine_action_services_create_ssl_siteConfig from "../githubAccount/application/machine/action/services/create/ssl/siteConfig.js";
import type * as githubAccount_application_machine_action_services_create_ssl_websocket from "../githubAccount/application/machine/action/services/create/ssl/websocket.js";
import type * as githubAccount_application_machine_action_services_create_ssl from "../githubAccount/application/machine/action/services/create/ssl.js";
import type * as githubAccount_application_machine_action_services_create from "../githubAccount/application/machine/action/services/create.js";
import type * as githubAccount_application_machine_action_services_delete_convexProject from "../githubAccount/application/machine/action/services/delete/convexProject.js";
import type * as githubAccount_application_machine_action_services_delete_dns from "../githubAccount/application/machine/action/services/delete/dns.js";
import type * as githubAccount_application_machine_action_services_delete_machine from "../githubAccount/application/machine/action/services/delete/machine.js";
import type * as githubAccount_application_machine_action_services_update_machine from "../githubAccount/application/machine/action/services/update/machine.js";
import type * as githubAccount_application_machine_action_services_update_resume from "../githubAccount/application/machine/action/services/update/resume.js";
import type * as githubAccount_application_machine_action_services_update_suspend from "../githubAccount/application/machine/action/services/update/suspend.js";
import type * as githubAccount_application_machine_action_services_update from "../githubAccount/application/machine/action/services/update.js";
import type * as githubAccount_application_machine_action_update from "../githubAccount/application/machine/action/update.js";
import type * as githubAccount_application_machine_conversation_message_action_create from "../githubAccount/application/machine/conversation/message/action/create.js";
import type * as githubAccount_application_machine_conversation_message_action_services_create from "../githubAccount/application/machine/conversation/message/action/services/create.js";
import type * as githubAccount_application_machine_mutation_create from "../githubAccount/application/machine/mutation/create.js";
import type * as githubAccount_application_machine_mutation_delete from "../githubAccount/application/machine/mutation/delete.js";
import type * as githubAccount_application_machine_mutation_update from "../githubAccount/application/machine/mutation/update.js";
import type * as githubAccount_application_machine_query_by_application from "../githubAccount/application/machine/query/by_application.js";
import type * as githubAccount_application_mutation_create from "../githubAccount/application/mutation/create.js";
import type * as githubAccount_application_mutation_delete from "../githubAccount/application/mutation/delete.js";
import type * as githubAccount_application_query_by_id from "../githubAccount/application/query/by_id.js";
import type * as githubAccount_application_query_by_user from "../githubAccount/application/query/by_user.js";
import type * as githubAccount_application_repository_action_create from "../githubAccount/application/repository/action/create.js";
import type * as githubAccount_application_repository_action_delete from "../githubAccount/application/repository/action/delete.js";
import type * as githubAccount_application_repository_action_services_create from "../githubAccount/application/repository/action/services/create.js";
import type * as githubAccount_application_repository_action_services_delete from "../githubAccount/application/repository/action/services/delete.js";
import type * as githubAccount_application_repository_files_action_create from "../githubAccount/application/repository/files/action/create.js";
import type * as githubAccount_application_repository_files_action_services_create from "../githubAccount/application/repository/files/action/services/create.js";
import type * as githubAccount_application_repository_files_action_services_dependencies_finder from "../githubAccount/application/repository/files/action/services/dependencies/finder.js";
import type * as githubAccount_application_repository_files_action_services_dependencies from "../githubAccount/application/repository/files/action/services/dependencies.js";
import type * as githubAccount_application_repository_files_action_services_file from "../githubAccount/application/repository/files/action/services/file.js";
import type * as githubAccount_application_repository_files_action_services_files from "../githubAccount/application/repository/files/action/services/files.js";
import type * as githubAccount_application_repository_files_action_services_github_content from "../githubAccount/application/repository/files/action/services/github/content.js";
import type * as githubAccount_application_repository_files_action_services_github_paths from "../githubAccount/application/repository/files/action/services/github/paths.js";
import type * as githubAccount_application_repository_files_mutation_create from "../githubAccount/application/repository/files/mutation/create.js";
import type * as githubAccount_application_repository_files_query_by_repository from "../githubAccount/application/repository/files/query/by_repository.js";
import type * as githubAccount_application_repository_mutation_create from "../githubAccount/application/repository/mutation/create.js";
import type * as githubAccount_application_repository_mutation_delete from "../githubAccount/application/repository/mutation/delete.js";
import type * as githubAccount_application_repository_query_by_application from "../githubAccount/application/repository/query/by_application.js";
import type * as githubAccount_mutation_create from "../githubAccount/mutation/create.js";
import type * as githubAccount_mutation_delete from "../githubAccount/mutation/delete.js";
import type * as githubAccount_query_by_user from "../githubAccount/query/by_user.js";
import type * as githubAccount_query_by_user_username from "../githubAccount/query/by_user_username.js";
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
  "githubAccount/action/services/create/exchange": typeof githubAccount_action_services_create_exchange;
  "githubAccount/action/services/create/fetch": typeof githubAccount_action_services_create_fetch;
  "githubAccount/action/services/create": typeof githubAccount_action_services_create;
  "githubAccount/application/action/create": typeof githubAccount_application_action_create;
  "githubAccount/application/action/delete": typeof githubAccount_application_action_delete;
  "githubAccount/application/action/services/create": typeof githubAccount_application_action_services_create;
  "githubAccount/application/action/services/delete": typeof githubAccount_application_action_services_delete;
  "githubAccount/application/document/action/create": typeof githubAccount_application_document_action_create;
  "githubAccount/application/document/action/delete": typeof githubAccount_application_document_action_delete;
  "githubAccount/application/document/action/update/files": typeof githubAccount_application_document_action_update_files;
  "githubAccount/application/document/action/update/services/files/system": typeof githubAccount_application_document_action_update_services_files_system;
  "githubAccount/application/document/action/update/services/files": typeof githubAccount_application_document_action_update_services_files;
  "githubAccount/application/document/action/update/services/response": typeof githubAccount_application_document_action_update_services_response;
  "githubAccount/application/document/action/update": typeof githubAccount_application_document_action_update;
  "githubAccount/application/document/conversation/action/create": typeof githubAccount_application_document_conversation_action_create;
  "githubAccount/application/document/conversation/action/update": typeof githubAccount_application_document_conversation_action_update;
  "githubAccount/application/document/conversation/message/action/create": typeof githubAccount_application_document_conversation_message_action_create;
  "githubAccount/application/document/conversation/message/action/services/configuration/system": typeof githubAccount_application_document_conversation_message_action_services_configuration_system;
  "githubAccount/application/document/conversation/message/action/services/create": typeof githubAccount_application_document_conversation_message_action_services_create;
  "githubAccount/application/document/conversation/message/mutation/create": typeof githubAccount_application_document_conversation_message_mutation_create;
  "githubAccount/application/document/conversation/message/mutation/delete": typeof githubAccount_application_document_conversation_message_mutation_delete;
  "githubAccount/application/document/conversation/message/query/by_conversation": typeof githubAccount_application_document_conversation_message_query_by_conversation;
  "githubAccount/application/document/conversation/mutation/create": typeof githubAccount_application_document_conversation_mutation_create;
  "githubAccount/application/document/conversation/mutation/update": typeof githubAccount_application_document_conversation_mutation_update;
  "githubAccount/application/document/conversation/query/by_document": typeof githubAccount_application_document_conversation_query_by_document;
  "githubAccount/application/document/mutation/create": typeof githubAccount_application_document_mutation_create;
  "githubAccount/application/document/mutation/delete": typeof githubAccount_application_document_mutation_delete;
  "githubAccount/application/document/mutation/update": typeof githubAccount_application_document_mutation_update;
  "githubAccount/application/document/query/by_application": typeof githubAccount_application_document_query_by_application;
  "githubAccount/application/document/query/by_id": typeof githubAccount_application_document_query_by_id;
  "githubAccount/application/machine/action/create": typeof githubAccount_application_machine_action_create;
  "githubAccount/application/machine/action/delete": typeof githubAccount_application_machine_action_delete;
  "githubAccount/application/machine/action/services/create/devServer/convexProject": typeof githubAccount_application_machine_action_services_create_devServer_convexProject;
  "githubAccount/application/machine/action/services/create/devServer/envManager": typeof githubAccount_application_machine_action_services_create_devServer_envManager;
  "githubAccount/application/machine/action/services/create/devServer/nextjsConfig": typeof githubAccount_application_machine_action_services_create_devServer_nextjsConfig;
  "githubAccount/application/machine/action/services/create/devServer/packageManager": typeof githubAccount_application_machine_action_services_create_devServer_packageManager;
  "githubAccount/application/machine/action/services/create/devServer/pm2Manager": typeof githubAccount_application_machine_action_services_create_devServer_pm2Manager;
  "githubAccount/application/machine/action/services/create/devServer": typeof githubAccount_application_machine_action_services_create_devServer;
  "githubAccount/application/machine/action/services/create/dns": typeof githubAccount_application_machine_action_services_create_dns;
  "githubAccount/application/machine/action/services/create/machine": typeof githubAccount_application_machine_action_services_create_machine;
  "githubAccount/application/machine/action/services/create/repository": typeof githubAccount_application_machine_action_services_create_repository;
  "githubAccount/application/machine/action/services/create/setupSystem": typeof githubAccount_application_machine_action_services_create_setupSystem;
  "githubAccount/application/machine/action/services/create/ssl/siteConfig": typeof githubAccount_application_machine_action_services_create_ssl_siteConfig;
  "githubAccount/application/machine/action/services/create/ssl/websocket": typeof githubAccount_application_machine_action_services_create_ssl_websocket;
  "githubAccount/application/machine/action/services/create/ssl": typeof githubAccount_application_machine_action_services_create_ssl;
  "githubAccount/application/machine/action/services/create": typeof githubAccount_application_machine_action_services_create;
  "githubAccount/application/machine/action/services/delete/convexProject": typeof githubAccount_application_machine_action_services_delete_convexProject;
  "githubAccount/application/machine/action/services/delete/dns": typeof githubAccount_application_machine_action_services_delete_dns;
  "githubAccount/application/machine/action/services/delete/machine": typeof githubAccount_application_machine_action_services_delete_machine;
  "githubAccount/application/machine/action/services/update/machine": typeof githubAccount_application_machine_action_services_update_machine;
  "githubAccount/application/machine/action/services/update/resume": typeof githubAccount_application_machine_action_services_update_resume;
  "githubAccount/application/machine/action/services/update/suspend": typeof githubAccount_application_machine_action_services_update_suspend;
  "githubAccount/application/machine/action/services/update": typeof githubAccount_application_machine_action_services_update;
  "githubAccount/application/machine/action/update": typeof githubAccount_application_machine_action_update;
  "githubAccount/application/machine/conversation/message/action/create": typeof githubAccount_application_machine_conversation_message_action_create;
  "githubAccount/application/machine/conversation/message/action/services/create": typeof githubAccount_application_machine_conversation_message_action_services_create;
  "githubAccount/application/machine/mutation/create": typeof githubAccount_application_machine_mutation_create;
  "githubAccount/application/machine/mutation/delete": typeof githubAccount_application_machine_mutation_delete;
  "githubAccount/application/machine/mutation/update": typeof githubAccount_application_machine_mutation_update;
  "githubAccount/application/machine/query/by_application": typeof githubAccount_application_machine_query_by_application;
  "githubAccount/application/mutation/create": typeof githubAccount_application_mutation_create;
  "githubAccount/application/mutation/delete": typeof githubAccount_application_mutation_delete;
  "githubAccount/application/query/by_id": typeof githubAccount_application_query_by_id;
  "githubAccount/application/query/by_user": typeof githubAccount_application_query_by_user;
  "githubAccount/application/repository/action/create": typeof githubAccount_application_repository_action_create;
  "githubAccount/application/repository/action/delete": typeof githubAccount_application_repository_action_delete;
  "githubAccount/application/repository/action/services/create": typeof githubAccount_application_repository_action_services_create;
  "githubAccount/application/repository/action/services/delete": typeof githubAccount_application_repository_action_services_delete;
  "githubAccount/application/repository/files/action/create": typeof githubAccount_application_repository_files_action_create;
  "githubAccount/application/repository/files/action/services/create": typeof githubAccount_application_repository_files_action_services_create;
  "githubAccount/application/repository/files/action/services/dependencies/finder": typeof githubAccount_application_repository_files_action_services_dependencies_finder;
  "githubAccount/application/repository/files/action/services/dependencies": typeof githubAccount_application_repository_files_action_services_dependencies;
  "githubAccount/application/repository/files/action/services/file": typeof githubAccount_application_repository_files_action_services_file;
  "githubAccount/application/repository/files/action/services/files": typeof githubAccount_application_repository_files_action_services_files;
  "githubAccount/application/repository/files/action/services/github/content": typeof githubAccount_application_repository_files_action_services_github_content;
  "githubAccount/application/repository/files/action/services/github/paths": typeof githubAccount_application_repository_files_action_services_github_paths;
  "githubAccount/application/repository/files/mutation/create": typeof githubAccount_application_repository_files_mutation_create;
  "githubAccount/application/repository/files/query/by_repository": typeof githubAccount_application_repository_files_query_by_repository;
  "githubAccount/application/repository/mutation/create": typeof githubAccount_application_repository_mutation_create;
  "githubAccount/application/repository/mutation/delete": typeof githubAccount_application_repository_mutation_delete;
  "githubAccount/application/repository/query/by_application": typeof githubAccount_application_repository_query_by_application;
  "githubAccount/mutation/create": typeof githubAccount_mutation_create;
  "githubAccount/mutation/delete": typeof githubAccount_mutation_delete;
  "githubAccount/query/by_user": typeof githubAccount_query_by_user;
  "githubAccount/query/by_user_username": typeof githubAccount_query_by_user_username;
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
