/**
 * Created by 王冬 on 2022/3/16.
 * QQ: 20004604
 * weChat: qq20004604
 * 功能说明：
 *  公共配置
 */

const OPTIONS = {
    // 数据状态
    // standard 合法标准随机数据
    // border 合法边界数据
    // outlimit 非法超限数据（需要将超限数据添加到 this.OutLimitKeys 里，否则生成随机数据）
    DataStatus: {
        value: '',
        options: [
            {label: '标准合法随机数据', value: 'Standard'},
            {label: '边界数据', value: 'Border'},
            {label: '非法数据', value: 'Outlimit'},
        ],
        default: 'Standard'
    },
};


export default OPTIONS;
