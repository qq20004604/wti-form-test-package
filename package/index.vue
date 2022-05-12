<template>
    <div class="test-tool-container">
        <div id="test-tools" v-if="show">
            <i class="el-icon-close" @click="show=false"></i>
            <el-descriptions title="测试数据管理工具"
                             border
                             :column="1">
                <el-descriptions-item label="数据类型">
                    <el-select v-model="dataStatus"
                               size="mini"
                               placeholder="请选择"
                               disabled>
                        <template v-for="item in dataStatusList">
                            <el-option :key="item.value"
                                       :label="item.label"
                                       :value="item.value"/>
                        </template>
                    </el-select>

                    <BtnCanDisable @click-event="getDataByCustomize"
                                   ref="getDataByCustomizeBtn"
                                   size="mini"
                                   type="primary">
                        生成并写入表单
                        <span slot="disableText">写入成功</span>
                    </BtnCanDisable>
                </el-descriptions-item>

                <el-descriptions-item label="数据上传">
                    <el-radio v-model="isCreateNewData" :label="true">新增</el-radio>
                    <el-radio v-model="isCreateNewData" :label="false">更新</el-radio>
                </el-descriptions-item>

                <el-descriptions-item v-if="isCreateNewData" label="新增">
                    <BtnCanDisable @click-event="saveAllFormData"
                                   ref="createNewDataBtn">
                        将当前数据保存到远端
                        <span slot="disableText">保存成功</span>
                    </BtnCanDisable>
                    <el-link v-if="textNewCreateID"
                             type="success"
                             style="margin-left:10px;">
                        新增数据ID为：{{ textNewCreateID }}
                    </el-link>
                </el-descriptions-item>

                <el-descriptions-item v-else
                                      label="更新">
                    <el-input v-model="remoteID"
                              size="small"
                              type="number"
                              style="width:120px" placeholder="远端数据ID"/>
                    <el-button @click="saveAllFormData"
                               size="small"
                               type="primary">
                        {{ `更新远端数据` }}
                    </el-button>
                </el-descriptions-item>

                <el-descriptions-item label="加载远端数据">
                    <!--                    <el-input v-model="remoteID"-->
                    <!--                              size="small"-->
                    <!--                              type="number"-->
                    <!--                              style="width:100px" placeholder="远端数据ID"/>-->
                    <el-autocomplete size="small"
                                     popper-class="my-autocomplete"
                                     v-model="remoteID"
                                     style="width:100px;z-index: 99999"
                                     :fetch-suggestions="getLastestRemoteIDList"
                                     placeholder="远端数据ID">
                        <template slot-scope="{ item }">
                            <div class="name">{{ item.value }}</div>
                        </template>
                    </el-autocomplete>
                    <BtnCanDisable @click-event="loadRemoteData"
                                   ref="loadRemoteDataBtn">
                        {{ `加载远端 ID:${remoteID} 的数据` }}
                        <span slot="disableText">加载成功</span>
                    </BtnCanDisable>
                </el-descriptions-item>
            </el-descriptions>
        </div>
        <!--        <el-form ref="form" label-width="80px">-->
        <!--            <el-form-item label="前后缀">-->
        <!--                <el-input v-model="prepend" size="small" style="width:100px" placeholder="前缀字符串"/>-->
        <!--                <el-input v-model="append" size="small" style="width:100px" placeholder="后缀字符串"/>-->
        <!--            </el-form-item>-->
        <!--        </el-form>-->
    </div>
</template>

<script>
    // 自动测试工具
    // 目的是通过获取表单组件，以及 fields 获取表单结构，自动推断出表单应该填写的内容
    // 本组件应当注册到根组件上
    import OPTIONS from './option';
    import createAxios from './ajax.js';
    import BtnCanDisable from './btnCanDisable';

    export default {
        name: 'TestTools',
        props: {
            // form 表单
            refFormName: {
                type: String,
                default: ''
            },
            // 数据状态
            // standard 合法标准随机数据
            // border 合法边界数据
            // outlimit 非法超限数据（需要将超限数据添加到 this.OutLimitKeys 里，否则生成随机数据）
            // dataStatus: {
            //     type: String,
            //     default: 'standard'
            // },
            // 自定义校验函数
            // 字段是 key，值是函数，入参是：(this.DataType)
            customizeFn: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            // 超限数据的 key 的集合。只有启用超限模式才生效
            exceptOutLimitKeys: {
                type: Array,
                default: () => []
            }
        },
        components: {
            BtnCanDisable
        },
        mounted () {
            this.dataStatusList = OPTIONS.DataStatus.options;
            this.dataStatus = OPTIONS.DataStatus.default;


            this.axios = createAxios({
                baseURL: 'https://ribao.wti-xa.com',
            });
            this.loadCache();

            this.loadAllWtiForm();
        },
        data () {
            return {
                show: true,

                // axios实例
                axios: null,

                // 数据类型（标准、边界、超标）
                dataStatusList: [],
                // 当前数据类型
                privateDataStatus: 'standard',

                // 前缀（未生效，服务器端代码已有，暂不启用）
                prepend: '',
                // 后缀（未生效，服务器端代码已有，暂不启用）
                append: '',

                // 当前是插入新数据到远端（true），还是更新数据（false）
                isCreateNewData: true,

                // 新增数据成功后的ID
                textNewCreateID: '',

                // 更新数据时，远端数据ID
                remoteID: '',

                // 当前正在生效的表单组件实例列表
                activeWtiFormList: [],

                // 本地ID缓存
                // 数据管理规则：
                // 0、本地只缓存20个，多余的被删掉
                // 1、进入页面时加载一次 localStorage；
                // 2、新增：将最新的添加到本数组的头部。缓存到本地
                // 3、更新：如果已在数组则从数组中移除。然后将该更新ID添加到数组的头部。缓存到本地
                // 4、加载：如果已在数组则从数组中移除。然后将该更新ID添加到数组的头部。缓存到本地
                localCache: []
            };
        },
        computed: {
            dataStatus: {
                get () {
                    return this.privateDataStatus;
                },
                set (v) {
                    this.privateDataStatus = v;
                }
            }
        },
        methods: {
            // 获取所有 WtiForm 表单组件
            loadAllWtiForm () {
                // 如果window.App不是vue组件，那么直接返回
                if (!window.App || !window.App.$vnode || !window.App.$el) {
                    this.show = false;
                    return;
                }

                // 方法是从 window.App 开始往下递归遍历，找到 WtiForm 组件，则添加到list里
                const list = this._getChildrenWtiForm(window.App);

                // 如果没有 WtiForm 表单组件，说明父组件获取失败，直接return
                if (list.length === 0) {
                    this.show = false;
                    console.error('未找到 WtiForm 表单组件');
                }
                return list;
            },
            // 入参是某个组件，然后他会递归这个组件，出参是 WtiForm 组件
            // 添加时机是如果当前组件是WtiForm组件，那么就添加进去
            _getChildrenWtiForm (Component) {
                let WtiFormList = [];
                // 不考虑 WtiForm组件嵌套的情况，所以如果当前是，则直接返回
                if (Component.$options.name === 'WtiForm') {
                    // 考虑到有新旧两个版本的表单组件，因此不对旧表单组件进行兼容
                    // 做一个额外的版本判断逻辑。判断关键是字典表
                    if (Component.dynamicDict) {
                        WtiFormList.push(Component);
                    }
                } else {
                    if (Component.$children.length !== 0) {
                        Component.$children.forEach(item => {
                            const list = this._getChildrenWtiForm(item);
                            WtiFormList = [
                                ...WtiFormList,
                                ...list
                            ];
                        });
                    }
                }

                return WtiFormList;
            },

            // 获取WtiForm 表单组件的所有 fields 配置
            getAllFields (WtiFormList) {
                // console.log(WtiFormList);
                return WtiFormList.map(item => item.fields);
            },

            // 获取 WtiForm 表单组件的所有字典配置
            loadDynamicDict () {
                const dynamicDict = {};
                // 在处理字典相关的东西之前，需要先处理字典
                const list = this.loadAllWtiForm();
                if (list.length === 0) {
                    this.$message.error('未找到 WtiForm 表单组件');
                    return;
                }
                list.forEach(item => {
                    // 这里的 dynamicDict，不仅有值，还有 label等信息，所以要处理一下，只拿值
                    Object.assign(dynamicDict, item.dynamicDict);
                });
                const valueKey = list[0].dynamicSelectOption.value;
                Object.keys(dynamicDict).forEach(key => {
                    dynamicDict[key] = dynamicDict[key].map(item => {
                        return item[valueKey];
                    });
                });

                return dynamicDict;
            },

            // 接口：根据配置获取测试数据
            getDataByCustomize () {
                // 这里要先把所有fields mixin在一起；
                const formList = this.loadAllWtiForm();
                if (formList.length === 0) {
                    this.$message.error('未找到 WtiForm 表单组件');
                    return;
                }
                const fieldsList = this.getAllFields(formList);
                // 将所有 fields 合并起来
                let mixinField = [];
                fieldsList.forEach(item => {
                    mixinField = [ ...mixinField, ...item ];
                });
                // 获取所有字典
                const dynamicDict = this.loadDynamicDict();

                const payload = {
                    // 表单配置项
                    fields: mixinField,
                    // 动态字典，是form表单里的同名变量
                    dynamicDict: dynamicDict,
                    // 生成变量的类型
                    dataStatus: 'Standard',
                    // 这里是特殊配置（第一版先不支持远端通过自定义配置生成测试数据）
                    // options: {
                    //     // 自定义配置，key 对应的是那个 key
                    //     Customize: {
                    //         // 示例：Test指表单配置的key是 Test
                    //         Test: {
                    //             // 取值优先级：makeValueFn 函数 > valueType > ValueMaker.DataType
                    //             // 自定义生成数据函数，入参是当前全局的数据类型
                    //             // 非必须，默认为空
                    //             makeValueFn: dataType => {
                    //                 console.log(dataType);
                    //                 return '';
                    //             },
                    //             // 指生成测试数据的类型，可为空。
                    //             valueType: 'Standard',
                    //         }
                    //     }
                    // }
                };
                this.axios.post('/testdata/makeTestData', payload).then(res => {
                    let data;
                    if (res.request && res.config) {
                        data = res.data;
                    } else {
                        data = res;
                    }
                    if (data.code === 200) {
                        formList.forEach(form => {
                            form.updateFormData(data.data);
                        });
                        this.$refs.getDataByCustomizeBtn.setBtnDisable();
                    } else {
                        this.$message.error(data.msg);
                    }
                });
            },

            // 接口：获取所有表单组件的数据，并保存/更新到远端
            saveAllFormData () {
                const formList = this.loadAllWtiForm();
                if (formList.length === 0) {
                    this.$message.error('未找到 WtiForm 表单组件');
                    return;
                }
                // 所有表单的数据
                const data = {};
                formList.forEach(form => {
                    Object.assign(data, form.getData());
                });

                if (!this.isCreateNewData) {
                    // 是更新
                    if (!this.remoteID) {
                        return this.$message.error('更新模式下，必须有远端数据ID，才能更新');
                    }

                } else {
                    // 否则就是新增
                    this.axios.post('/testdata/saveTestData', {
                        data
                    }).then(res => {
                        let data;
                        if (res.request && res.config) {
                            data = res.data;
                        } else {
                            data = res;
                        }
                        return data;
                    }).then(res => {
                        if (res.code === 200) {
                            this.textNewCreateID = res.data.id;
                            this.remoteID = String(res.data.id);
                            this.$refs.createNewDataBtn.setBtnDisable();
                            this.updateCache(res.data.id);
                        } else {
                            this.$message.error(res.msg);
                        }
                    });
                }
            },

            // 接口：加载远端指定ID数据
            loadRemoteData () {
                const payload = {
                    id: this.remoteID
                };

                const formList = this.loadAllWtiForm();
                if (formList.length === 0) {
                    this.$message.error('未找到 WtiForm 表单组件');
                    return;
                }
                this.axios.post('/testdata/getRemoteTestData', payload).then(res => {
                    let data;
                    if (res.request && res.config) {
                        data = res.data;
                    } else {
                        data = res;
                    }
                    if (data.code === 200) {
                        formList.forEach(form => {
                            form.updateFormData(data.data);
                        });
                        this.$refs.loadRemoteDataBtn.setBtnDisable();
                        this.$message.success('数据加载成功');

                        this.updateCache(payload.id);
                    } else {
                        this.$message.error(data.msg);
                    }
                });
            },

            // 更新最近ID的缓存
            loadCache () {
                const KEY = 'test-tool-ID-cache';
                try {
                    this.localCache = JSON.parse(localStorage.getItem(KEY)) || [];
                } catch {
                    this.localCache = [];
                }
            },

            // 更新最新ID的缓存
            updateCache (id) {
                // 如果id为空，则返回
                if (!id) {
                    return;
                }

                const KEY = 'test-tool-ID-cache';
                // 数据管理规则：
                // 0、本地只缓存20个，多余的被删掉
                // 1、进入页面时加载一次 localStorage；
                // 2、新增：将最新的添加到本数组的头部。缓存到本地
                // 3、更新：如果已在数组则从数组中移除。然后将该更新ID添加到数组的头部。缓存到本地
                // 4、加载：如果已在数组则从数组中移除。然后将该更新ID添加到数组的头部。缓存到本地

                // 如果在里面，先移除
                const index = this.localCache.indexOf(String(id));
                let localCache;
                if (index > -1) {
                    localCache = [
                        ...this.localCache.slice(0, index),
                        ...this.localCache.slice(index + 1)
                    ];
                } else {
                    localCache = [
                        ...this.localCache
                    ];
                }
                // 将新的添加到头部
                localCache.unshift(String(id));

                // 如果多余20个，则把20个以后的删除
                if (localCache.length > 20) {
                    localCache = localCache.slice(0, 20);
                }
                // 保存并缓存到本地
                this.localCache = localCache;
                localStorage.setItem(KEY, JSON.stringify(localCache));
            },

            getLastestRemoteIDList (queryString, cb) {
                const list = this.localCache
                    // .filter(item => {
                    //     return item.indexOf(String(queryString)) > -1;
                    // })
                    .map(item => {
                        return {
                            value: String(item)
                        };
                    });
                cb(list);
            },

            // 将组件添加到 WtiForm 列表里。在 WtiForm 组件的 created 函数里执行
            addActiveWtiFormList (WtiFormComponent) {
                let isIn = false;
                this.activeWtiFormList.forEach(item => {
                    if (item === WtiFormComponent) {
                        isIn = true;
                    }
                });
                if (!isIn) {
                    this.activeWtiFormList.push(WtiFormComponent);
                }
            },

            // 将组件从 WtiForm 列表里移除。在 WtiForm 组件的 destoryed 函数里执行
            removeFromActiveWtiFormList (WtiFormComponent) {
                const i = this.activeWtiFormList.indexOf(WtiFormComponent);
                if (i !== -1) {
                    this.activeWtiFormList = this.activeWtiFormList.filter(item => item !== WtiFormComponent);
                }
            },
        }
    };
</script>

<style scoped lang="less">
    .test-tool-container {
        width: 0;
        height: 0;
    }

    #test-tools {
        position: fixed;
        top: 0;
        right: 20px;
        background-color: #fff;
        padding: 20px;
        border: 1px solid red;
        z-index: 999;

        /deep/ input::-webkit-outer-spin-button,
        /deep/ input::-webkit-inner-spin-button {
            -webkit-appearance: none;
        }

        /deep/ input[type='number'] {
            -moz-appearance: textfield;
        }

        .el-icon-close {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 20px;
            cursor: pointer;
        }
    }


</style>
