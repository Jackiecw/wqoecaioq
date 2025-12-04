/**
 * 菜单项接口定义
 */
export interface MenuItem {
    /** 菜单项唯一标识 */
    id: string;
    /** 显示文本 */
    label: string;
    /** 路由路径 */
    to: string;
    /** PrimeVue 图标名称 */
    icon: string;
}

/**
 * 用户信息接口
 */
export interface UserInfo {
    /** 用户名称 */
    name: string;
    /** 用户邮箱 */
    email: string;
    /** 头像 URL */
    avatar?: string;
}
