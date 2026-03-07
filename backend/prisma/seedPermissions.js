// ./backend/prisma/seedPermissions.js
// 独立种子脚本：初始化 Permission 表并关联 admin 角色
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 权限清单定义
 * scope: 功能域
 * action: 操作类型
 * label: 中文显示名
 */
const PERMISSIONS = [
    // 仪表盘
    { scope: 'DASHBOARD', action: 'VIEW', label: '查看仪表盘' },

    // 日历
    { scope: 'CALENDAR', action: 'VIEW', label: '查看工作日历' },
    { scope: 'CALENDAR', action: 'MANAGE', label: '管理日历事件' },

    // 周报
    { scope: 'REPORTS', action: 'FILL', label: '填写周报' },
    { scope: 'REPORTS', action: 'VIEW_ALL', label: '查看所有周报' },

    // 销售
    { scope: 'SALES', action: 'VIEW', label: '查看销售数据' },
    { scope: 'SALES', action: 'EDIT', label: '编辑销售数据' },
    { scope: 'SALES', action: 'IMPORT', label: '导入销售数据' },

    // 产品
    { scope: 'PRODUCTS', action: 'VIEW', label: '查看产品目录' },
    { scope: 'PRODUCTS', action: 'MANAGE', label: '管理产品' },

    // 店铺在售
    { scope: 'STORE_LISTINGS', action: 'VIEW', label: '查看店铺在售' },
    { scope: 'STORE_LISTINGS', action: 'MANAGE', label: '管理店铺商品' },

    // 广告
    { scope: 'ADVERTISING', action: 'VIEW', label: '查看广告数据' },
    { scope: 'ADVERTISING', action: 'MANAGE', label: '管理广告数据' },

    // 流量
    { scope: 'TRAFFIC', action: 'VIEW', label: '查看流量数据' },
    { scope: 'TRAFFIC', action: 'MANAGE', label: '管理流量数据' },

    // 财务
    { scope: 'FINANCE', action: 'VIEW', label: '查看财务数据' },
    { scope: 'FINANCE', action: 'ENTRY', label: '录入支出' },
    { scope: 'FINANCE', action: 'EXPORT', label: '导出财务数据' },
    { scope: 'FINANCE', action: 'MANAGE', label: '管理财务' },

    // 生产物流
    { scope: 'LOGISTICS', action: 'VIEW', label: '查看生产物流' },
    { scope: 'LOGISTICS', action: 'MANAGE', label: '管理生产物流' },

    // 绩效
    { scope: 'PERFORMANCE', action: 'VIEW', label: '查看绩效' },
    { scope: 'PERFORMANCE', action: 'MANAGE', label: '管理绩效' },

    // 常用链接
    { scope: 'LINKS', action: 'VIEW', label: '查看常用链接' },
    { scope: 'LINKS', action: 'MANAGE', label: '管理常用链接' },

    // 管理 - 用户
    { scope: 'ADMIN_USERS', action: 'VIEW', label: '查看用户' },
    { scope: 'ADMIN_USERS', action: 'MANAGE', label: '管理用户' },

    // 管理 - 店铺
    { scope: 'ADMIN_STORES', action: 'VIEW', label: '查看店铺配置' },
    { scope: 'ADMIN_STORES', action: 'MANAGE', label: '管理店铺配置' },

    // 管理 - 国家
    { scope: 'ADMIN_COUNTRIES', action: 'VIEW', label: '查看国家配置' },
    { scope: 'ADMIN_COUNTRIES', action: 'MANAGE', label: '管理国家配置' },

    // 管理 - 指标
    { scope: 'ADMIN_METRICS', action: 'VIEW', label: '查看数据指标' },
    { scope: 'ADMIN_METRICS', action: 'MANAGE', label: '管理数据指标' },

    // 管理 - 角色
    { scope: 'ADMIN_ROLES', action: 'VIEW', label: '查看角色' },
    { scope: 'ADMIN_ROLES', action: 'MANAGE', label: '管理角色' },

    // 管理 - 分类
    { scope: 'ADMIN_CATEGORIES', action: 'VIEW', label: '查看分类' },
    { scope: 'ADMIN_CATEGORIES', action: 'MANAGE', label: '管理分类' },
];

async function main() {
    console.log('🔑 开始初始化权限数据...');

    // 1. Upsert 所有权限
    const permissionRecords = [];
    for (const perm of PERMISSIONS) {
        const record = await prisma.permission.upsert({
            where: {
                scope_action: { scope: perm.scope, action: perm.action },
            },
            update: { label: perm.label },
            create: perm,
        });
        permissionRecords.push(record);
        console.log(`  ✅ ${perm.scope}:${perm.action} - ${perm.label}`);
    }

    // 2. 将 admin 角色标记为系统角色，并关联所有权限
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (adminRole) {
        await prisma.role.update({
            where: { id: adminRole.id },
            data: {
                isSystem: true,
                permissions: {
                    set: permissionRecords.map((p) => ({ id: p.id })),
                },
            },
        });
        console.log(`\n🛡️  admin 角色已标记为系统角色，并关联 ${permissionRecords.length} 项权限。`);
    } else {
        console.warn('⚠️  未找到 admin 角色，请先运行 seed.js 创建基础数据。');
    }

    // 3. 为 operation 角色赋予基本权限（如果存在）
    const operationRole = await prisma.role.findUnique({ where: { name: 'operation' } });
    if (operationRole) {
        const basicScopes = ['DASHBOARD', 'CALENDAR', 'REPORTS', 'SALES', 'LINKS', 'PERFORMANCE'];
        const basicPermissions = permissionRecords.filter(
            (p) => basicScopes.includes(p.scope) && p.action === 'VIEW'
        );
        // Also add REPORTS:FILL, SALES:EDIT, SALES:IMPORT, CALENDAR:VIEW
        const additionalPerms = permissionRecords.filter(
            (p) =>
                (p.scope === 'REPORTS' && p.action === 'FILL') ||
                (p.scope === 'SALES' && p.action === 'EDIT') ||
                (p.scope === 'SALES' && p.action === 'IMPORT') ||
                (p.scope === 'FINANCE' && p.action === 'ENTRY')
        );
        const allBasicPerms = [...basicPermissions, ...additionalPerms];

        await prisma.role.update({
            where: { id: operationRole.id },
            data: {
                permissions: {
                    set: allBasicPerms.map((p) => ({ id: p.id })),
                },
            },
        });
        console.log(`\n👤 operation 角色已关联 ${allBasicPerms.length} 项基本权限。`);
    }

    console.log('\n✅ 权限数据初始化完成！');
}

main()
    .catch((e) => {
        console.error('❌ 权限种子脚本出错:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
