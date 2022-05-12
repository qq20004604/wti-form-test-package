/**
 * Created by 王冬 on 2022/5/9.
 * QQ: 20004604
 * weChat: qq20004604
 * 功能说明：
 *
 */
import Vue from 'vue';
import TestTools from './index.vue';

const TestToolsConstructor = Vue.extend(TestTools);

const WhiteList = [
    'cf-pc-dev',
    'cf-pc-qa',
    'localhost',
    '127.0.0.1'
];

const fn = () => {
    let instance;
    return function () {
        // 两个判断条件，关系是and
        // 1. 必须是指定白名单域名
        // 2. 必须域名里含有 debug=true，又或者是 sessionStorage 的 debug = true
        let inWhiteList = false;
        WhiteList.forEach(s => {
            if (window.location.host.toLocaleLowerCase().indexOf(s) > -1) {
                inWhiteList = true;
            }
        });
        // 如果不在就返回不做任何处理
        if (!inWhiteList) {
            return;
        }

        // 再判断，不通过就返回
        if (window.location.href.toLocaleLowerCase().indexOf('debug=true') === -1 &&
            sessionStorage.getItem('debug') !== 'true') {
            return;
        }

        // 全局启用
        sessionStorage.setItem('debug', 'true');

        // 单例模式，惰性返回弹窗实例
        if (instance) {
            instance.visible = true;
            return instance;
        }

        instance = new TestToolsConstructor({
            // data: isPlainObject(options) ? {...options} : {}
        });

        instance.$mount();
        document.body.appendChild(instance.$el);
        instance.visible = true;

        // 暴露实例方便后续的Ref操作
        return instance;
    };
};
export default {
    install: (Vue) => {
        Vue.mixin({
            mounted: function () {
                if (this._uid === 1) {
                    fn()();
                }
            }
        });
    }
};

