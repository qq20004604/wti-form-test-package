<template>
    <el-button @click="onClick"
               :disabled="timeLeft!==0"
               :size="size"
               :type="type">
        <template v-if="$slots.default && timeLeft===0">
            <slot></slot>
        </template>
        <template v-else>
            <slot name="disableText"></slot>
            {{ timeLeft ? `(${timeLeft}s)` : '' }}
        </template>
    </el-button>
</template>

<script>
    export default {
        name: 'BtnCanDisable',
        props: {
            // 点击事件
            clickEvent: {
                type: Function,
                default: () => {
                }
            },
            size: {
                type: String,
                default: 'small'
            },
            type: {
                type: String,
                default: 'primary'
            },
        },
        data () {
            return {
                timeLeft: 0,
                endTime: 0,

                timer: null
            };
        },
        methods: {
            onClick () {
                this.$emit('click-event');
            },

            setBtnDisable (timeLeft = 3000) {
                this.endTime = timeLeft + Number(new Date());
                this.setCountdown();
            },

            setCountdown () {
                // 开始倒计时
                console.log('开始倒计时');
                const timeLeft = (this.endTime - Number(new Date())) / 1000;
                this.timeLeft = timeLeft.toFixed(0);
                this.timer = setInterval(() => {
                    const timeLeft = (this.endTime - Number(new Date())) / 1000;
                    this.timeLeft = timeLeft.toFixed(0);
                    console.log(this.timeLeft);
                    if (this.timeLeft <= 0) {
                        console.log('倒计时结束');
                        this.timeLeft = 0;
                        this.endTime = 0;
                        clearInterval(this.timer);
                    }
                }, 1000);
            }
        }
    };
</script>
