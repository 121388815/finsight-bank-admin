//类型定义统一出口，简化导入路径，并区分纯类型与运行时常量
export type * from "./api";
export type * from "./customer";
export type * from "./loan";
export type * from "./log";
export type * from "./risk";
export type * from "./user";

//运行时常量的精准导出
export { PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSION_MAP } from "./user";
