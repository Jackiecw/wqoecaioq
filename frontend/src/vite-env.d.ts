/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// PrimeVue Tooltip 指令类型声明
import type { Directive } from 'vue'

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        vTooltip: Directive
    }
}
