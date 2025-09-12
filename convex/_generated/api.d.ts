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
import type * as application_action_create from "../application/action/create.js";
import type * as application_action_delete from "../application/action/delete.js";
import type * as application_action_services_create from "../application/action/services/create.js";
import type * as application_action_services_delete from "../application/action/services/delete.js";
import type * as application_document_action_create from "../application/document/action/create.js";
import type * as application_document_action_delete from "../application/document/action/delete.js";
import type * as application_document_action_update_files from "../application/document/action/update/files.js";
import type * as application_document_action_update_services_files_system from "../application/document/action/update/services/files/system.js";
import type * as application_document_action_update_services_files from "../application/document/action/update/services/files.js";
import type * as application_document_action_update_services_response from "../application/document/action/update/services/response.js";
import type * as application_document_action_update from "../application/document/action/update.js";
import type * as application_document_conversation_action_create from "../application/document/conversation/action/create.js";
import type * as application_document_conversation_action_update from "../application/document/conversation/action/update.js";
import type * as application_document_conversation_message_action_create from "../application/document/conversation/message/action/create.js";
import type * as application_document_conversation_message_action_services_configuration_system from "../application/document/conversation/message/action/services/configuration/system.js";
import type * as application_document_conversation_message_action_services_create from "../application/document/conversation/message/action/services/create.js";
import type * as application_document_conversation_message_action_services_stages_determine from "../application/document/conversation/message/action/services/stages/determine.js";
import type * as application_document_conversation_message_action_services_stages_process from "../application/document/conversation/message/action/services/stages/process.js";
import type * as application_document_conversation_message_mutation_create from "../application/document/conversation/message/mutation/create.js";
import type * as application_document_conversation_message_mutation_delete from "../application/document/conversation/message/mutation/delete.js";
import type * as application_document_conversation_message_query_by_conversation from "../application/document/conversation/message/query/by_conversation.js";
import type * as application_document_conversation_mutation_create from "../application/document/conversation/mutation/create.js";
import type * as application_document_conversation_mutation_update from "../application/document/conversation/mutation/update.js";
import type * as application_document_conversation_query_by_document from "../application/document/conversation/query/by_document.js";
import type * as application_document_mutation_create from "../application/document/mutation/create.js";
import type * as application_document_mutation_delete from "../application/document/mutation/delete.js";
import type * as application_document_mutation_update from "../application/document/mutation/update.js";
import type * as application_document_query_by_application from "../application/document/query/by_application.js";
import type * as application_document_query_by_id from "../application/document/query/by_id.js";
import type * as application_machine_action_create from "../application/machine/action/create.js";
import type * as application_machine_action_delete from "../application/machine/action/delete.js";
import type * as application_machine_action_services_create_schedule1_dns from "../application/machine/action/services/create/schedule1/dns.js";
import type * as application_machine_action_services_create_schedule1_machine from "../application/machine/action/services/create/schedule1/machine.js";
import type * as application_machine_action_services_create_schedule1_setupSystem from "../application/machine/action/services/create/schedule1/setupSystem.js";
import type * as application_machine_action_services_create_schedule1 from "../application/machine/action/services/create/schedule1.js";
import type * as application_machine_action_services_create_schedule2_devServer_convexAuth from "../application/machine/action/services/create/schedule2/devServer/convexAuth.js";
import type * as application_machine_action_services_create_schedule2_devServer_convexProject from "../application/machine/action/services/create/schedule2/devServer/convexProject.js";
import type * as application_machine_action_services_create_schedule2_devServer_envManager from "../application/machine/action/services/create/schedule2/devServer/envManager.js";
import type * as application_machine_action_services_create_schedule2_devServer_nextjsConfig from "../application/machine/action/services/create/schedule2/devServer/nextjsConfig.js";
import type * as application_machine_action_services_create_schedule2_devServer_packageManager from "../application/machine/action/services/create/schedule2/devServer/packageManager.js";
import type * as application_machine_action_services_create_schedule2_devServer_pm2Manager from "../application/machine/action/services/create/schedule2/devServer/pm2Manager.js";
import type * as application_machine_action_services_create_schedule2_devServer from "../application/machine/action/services/create/schedule2/devServer.js";
import type * as application_machine_action_services_create_schedule2_repository from "../application/machine/action/services/create/schedule2/repository.js";
import type * as application_machine_action_services_create_schedule2_ssl_siteConfig from "../application/machine/action/services/create/schedule2/ssl/siteConfig.js";
import type * as application_machine_action_services_create_schedule2_ssl_websocket from "../application/machine/action/services/create/schedule2/ssl/websocket.js";
import type * as application_machine_action_services_create_schedule2_ssl from "../application/machine/action/services/create/schedule2/ssl.js";
import type * as application_machine_action_services_create_schedule2 from "../application/machine/action/services/create/schedule2.js";
import type * as application_machine_action_services_create from "../application/machine/action/services/create.js";
import type * as application_machine_action_services_delete_convexProject from "../application/machine/action/services/delete/convexProject.js";
import type * as application_machine_action_services_delete_dns from "../application/machine/action/services/delete/dns.js";
import type * as application_machine_action_services_delete_machine from "../application/machine/action/services/delete/machine.js";
import type * as application_machine_action_services_update_machine from "../application/machine/action/services/update/machine.js";
import type * as application_machine_action_services_update_resume from "../application/machine/action/services/update/resume.js";
import type * as application_machine_action_services_update_suspend from "../application/machine/action/services/update/suspend.js";
import type * as application_machine_action_services_update from "../application/machine/action/services/update.js";
import type * as application_machine_action_update from "../application/machine/action/update.js";
import type * as application_machine_conversation_message_action_create from "../application/machine/conversation/message/action/create.js";
import type * as application_machine_conversation_message_action_services_create from "../application/machine/conversation/message/action/services/create.js";
import type * as application_machine_conversation_message_action_services_github from "../application/machine/conversation/message/action/services/github.js";
import type * as application_machine_conversation_message_action_services_system from "../application/machine/conversation/message/action/services/system.js";
import type * as application_machine_mutation_create from "../application/machine/mutation/create.js";
import type * as application_machine_mutation_delete from "../application/machine/mutation/delete.js";
import type * as application_machine_mutation_scheduler from "../application/machine/mutation/scheduler.js";
import type * as application_machine_mutation_update from "../application/machine/mutation/update.js";
import type * as application_machine_query_by_application from "../application/machine/query/by_application.js";
import type * as application_machine_query_by_id from "../application/machine/query/by_id.js";
import type * as application_mutation_create from "../application/mutation/create.js";
import type * as application_mutation_delete from "../application/mutation/delete.js";
import type * as application_query_by_id from "../application/query/by_id.js";
import type * as application_query_by_user from "../application/query/by_user.js";
import type * as application_repository_action_create from "../application/repository/action/create.js";
import type * as application_repository_action_delete from "../application/repository/action/delete.js";
import type * as application_repository_action_services_create from "../application/repository/action/services/create.js";
import type * as application_repository_action_services_delete from "../application/repository/action/services/delete.js";
import type * as application_repository_files_action_create from "../application/repository/files/action/create.js";
import type * as application_repository_files_action_services_create_dependencies_finder from "../application/repository/files/action/services/create/dependencies/finder.js";
import type * as application_repository_files_action_services_create_dependencies from "../application/repository/files/action/services/create/dependencies.js";
import type * as application_repository_files_action_services_create_file from "../application/repository/files/action/services/create/file.js";
import type * as application_repository_files_action_services_create_files from "../application/repository/files/action/services/create/files.js";
import type * as application_repository_files_action_services_create_github_content from "../application/repository/files/action/services/create/github/content.js";
import type * as application_repository_files_action_services_create_github_paths from "../application/repository/files/action/services/create/github/paths.js";
import type * as application_repository_files_action_services_create from "../application/repository/files/action/services/create.js";
import type * as application_repository_files_mutation_create from "../application/repository/files/mutation/create.js";
import type * as application_repository_files_query_by_repository from "../application/repository/files/query/by_repository.js";
import type * as application_repository_mutation_create from "../application/repository/mutation/create.js";
import type * as application_repository_mutation_delete from "../application/repository/mutation/delete.js";
import type * as application_repository_query_by_application from "../application/repository/query/by_application.js";
import type * as application_repository_query_by_application_name from "../application/repository/query/by_application_name.js";
import type * as auth from "../auth.js";
import type * as githubAccount_action_create from "../githubAccount/action/create.js";
import type * as githubAccount_action_services_create_exchange from "../githubAccount/action/services/create/exchange.js";
import type * as githubAccount_action_services_create_fetch from "../githubAccount/action/services/create/fetch.js";
import type * as githubAccount_action_services_create from "../githubAccount/action/services/create.js";
import type * as githubAccount_mutation_create from "../githubAccount/mutation/create.js";
import type * as githubAccount_mutation_delete from "../githubAccount/mutation/delete.js";
import type * as githubAccount_query_by_id from "../githubAccount/query/by_id.js";
import type * as githubAccount_query_by_user from "../githubAccount/query/by_user.js";
import type * as githubAccount_query_by_user_username from "../githubAccount/query/by_user_username.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as wnAdmin_mutation_use from "../wnAdmin/mutation/use.js";
import type * as wnAdmin_query_by_code from "../wnAdmin/query/by_code.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "application/action/create": typeof application_action_create;
  "application/action/delete": typeof application_action_delete;
  "application/action/services/create": typeof application_action_services_create;
  "application/action/services/delete": typeof application_action_services_delete;
  "application/document/action/create": typeof application_document_action_create;
  "application/document/action/delete": typeof application_document_action_delete;
  "application/document/action/update/files": typeof application_document_action_update_files;
  "application/document/action/update/services/files/system": typeof application_document_action_update_services_files_system;
  "application/document/action/update/services/files": typeof application_document_action_update_services_files;
  "application/document/action/update/services/response": typeof application_document_action_update_services_response;
  "application/document/action/update": typeof application_document_action_update;
  "application/document/conversation/action/create": typeof application_document_conversation_action_create;
  "application/document/conversation/action/update": typeof application_document_conversation_action_update;
  "application/document/conversation/message/action/create": typeof application_document_conversation_message_action_create;
  "application/document/conversation/message/action/services/configuration/system": typeof application_document_conversation_message_action_services_configuration_system;
  "application/document/conversation/message/action/services/create": typeof application_document_conversation_message_action_services_create;
  "application/document/conversation/message/action/services/stages/determine": typeof application_document_conversation_message_action_services_stages_determine;
  "application/document/conversation/message/action/services/stages/process": typeof application_document_conversation_message_action_services_stages_process;
  "application/document/conversation/message/mutation/create": typeof application_document_conversation_message_mutation_create;
  "application/document/conversation/message/mutation/delete": typeof application_document_conversation_message_mutation_delete;
  "application/document/conversation/message/query/by_conversation": typeof application_document_conversation_message_query_by_conversation;
  "application/document/conversation/mutation/create": typeof application_document_conversation_mutation_create;
  "application/document/conversation/mutation/update": typeof application_document_conversation_mutation_update;
  "application/document/conversation/query/by_document": typeof application_document_conversation_query_by_document;
  "application/document/mutation/create": typeof application_document_mutation_create;
  "application/document/mutation/delete": typeof application_document_mutation_delete;
  "application/document/mutation/update": typeof application_document_mutation_update;
  "application/document/query/by_application": typeof application_document_query_by_application;
  "application/document/query/by_id": typeof application_document_query_by_id;
  "application/machine/action/create": typeof application_machine_action_create;
  "application/machine/action/delete": typeof application_machine_action_delete;
  "application/machine/action/services/create/schedule1/dns": typeof application_machine_action_services_create_schedule1_dns;
  "application/machine/action/services/create/schedule1/machine": typeof application_machine_action_services_create_schedule1_machine;
  "application/machine/action/services/create/schedule1/setupSystem": typeof application_machine_action_services_create_schedule1_setupSystem;
  "application/machine/action/services/create/schedule1": typeof application_machine_action_services_create_schedule1;
  "application/machine/action/services/create/schedule2/devServer/convexAuth": typeof application_machine_action_services_create_schedule2_devServer_convexAuth;
  "application/machine/action/services/create/schedule2/devServer/convexProject": typeof application_machine_action_services_create_schedule2_devServer_convexProject;
  "application/machine/action/services/create/schedule2/devServer/envManager": typeof application_machine_action_services_create_schedule2_devServer_envManager;
  "application/machine/action/services/create/schedule2/devServer/nextjsConfig": typeof application_machine_action_services_create_schedule2_devServer_nextjsConfig;
  "application/machine/action/services/create/schedule2/devServer/packageManager": typeof application_machine_action_services_create_schedule2_devServer_packageManager;
  "application/machine/action/services/create/schedule2/devServer/pm2Manager": typeof application_machine_action_services_create_schedule2_devServer_pm2Manager;
  "application/machine/action/services/create/schedule2/devServer": typeof application_machine_action_services_create_schedule2_devServer;
  "application/machine/action/services/create/schedule2/repository": typeof application_machine_action_services_create_schedule2_repository;
  "application/machine/action/services/create/schedule2/ssl/siteConfig": typeof application_machine_action_services_create_schedule2_ssl_siteConfig;
  "application/machine/action/services/create/schedule2/ssl/websocket": typeof application_machine_action_services_create_schedule2_ssl_websocket;
  "application/machine/action/services/create/schedule2/ssl": typeof application_machine_action_services_create_schedule2_ssl;
  "application/machine/action/services/create/schedule2": typeof application_machine_action_services_create_schedule2;
  "application/machine/action/services/create": typeof application_machine_action_services_create;
  "application/machine/action/services/delete/convexProject": typeof application_machine_action_services_delete_convexProject;
  "application/machine/action/services/delete/dns": typeof application_machine_action_services_delete_dns;
  "application/machine/action/services/delete/machine": typeof application_machine_action_services_delete_machine;
  "application/machine/action/services/update/machine": typeof application_machine_action_services_update_machine;
  "application/machine/action/services/update/resume": typeof application_machine_action_services_update_resume;
  "application/machine/action/services/update/suspend": typeof application_machine_action_services_update_suspend;
  "application/machine/action/services/update": typeof application_machine_action_services_update;
  "application/machine/action/update": typeof application_machine_action_update;
  "application/machine/conversation/message/action/create": typeof application_machine_conversation_message_action_create;
  "application/machine/conversation/message/action/services/create": typeof application_machine_conversation_message_action_services_create;
  "application/machine/conversation/message/action/services/github": typeof application_machine_conversation_message_action_services_github;
  "application/machine/conversation/message/action/services/system": typeof application_machine_conversation_message_action_services_system;
  "application/machine/mutation/create": typeof application_machine_mutation_create;
  "application/machine/mutation/delete": typeof application_machine_mutation_delete;
  "application/machine/mutation/scheduler": typeof application_machine_mutation_scheduler;
  "application/machine/mutation/update": typeof application_machine_mutation_update;
  "application/machine/query/by_application": typeof application_machine_query_by_application;
  "application/machine/query/by_id": typeof application_machine_query_by_id;
  "application/mutation/create": typeof application_mutation_create;
  "application/mutation/delete": typeof application_mutation_delete;
  "application/query/by_id": typeof application_query_by_id;
  "application/query/by_user": typeof application_query_by_user;
  "application/repository/action/create": typeof application_repository_action_create;
  "application/repository/action/delete": typeof application_repository_action_delete;
  "application/repository/action/services/create": typeof application_repository_action_services_create;
  "application/repository/action/services/delete": typeof application_repository_action_services_delete;
  "application/repository/files/action/create": typeof application_repository_files_action_create;
  "application/repository/files/action/services/create/dependencies/finder": typeof application_repository_files_action_services_create_dependencies_finder;
  "application/repository/files/action/services/create/dependencies": typeof application_repository_files_action_services_create_dependencies;
  "application/repository/files/action/services/create/file": typeof application_repository_files_action_services_create_file;
  "application/repository/files/action/services/create/files": typeof application_repository_files_action_services_create_files;
  "application/repository/files/action/services/create/github/content": typeof application_repository_files_action_services_create_github_content;
  "application/repository/files/action/services/create/github/paths": typeof application_repository_files_action_services_create_github_paths;
  "application/repository/files/action/services/create": typeof application_repository_files_action_services_create;
  "application/repository/files/mutation/create": typeof application_repository_files_mutation_create;
  "application/repository/files/query/by_repository": typeof application_repository_files_query_by_repository;
  "application/repository/mutation/create": typeof application_repository_mutation_create;
  "application/repository/mutation/delete": typeof application_repository_mutation_delete;
  "application/repository/query/by_application": typeof application_repository_query_by_application;
  "application/repository/query/by_application_name": typeof application_repository_query_by_application_name;
  auth: typeof auth;
  "githubAccount/action/create": typeof githubAccount_action_create;
  "githubAccount/action/services/create/exchange": typeof githubAccount_action_services_create_exchange;
  "githubAccount/action/services/create/fetch": typeof githubAccount_action_services_create_fetch;
  "githubAccount/action/services/create": typeof githubAccount_action_services_create;
  "githubAccount/mutation/create": typeof githubAccount_mutation_create;
  "githubAccount/mutation/delete": typeof githubAccount_mutation_delete;
  "githubAccount/query/by_id": typeof githubAccount_query_by_id;
  "githubAccount/query/by_user": typeof githubAccount_query_by_user;
  "githubAccount/query/by_user_username": typeof githubAccount_query_by_user_username;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  "wnAdmin/mutation/use": typeof wnAdmin_mutation_use;
  "wnAdmin/query/by_code": typeof wnAdmin_query_by_code;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
