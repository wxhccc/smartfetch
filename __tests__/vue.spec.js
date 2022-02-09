/* eslint-env node, jest */
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import smartfetch from '../'
import vueFetch from '../dist/vue-plugin'

window.alert = jest.fn()

const SubmitBtns = {
  template: `<div>
  <button id="btn1" @click="onBtn1Click">{{loading}}</button>
  <button id="btn2" @click="onBtn2Click">{{loading2}}</button>
  <button id="btn3" @click="onBtn3Click">{{loading3}}</button>
  </div>`,
  data() {
    return {
      loading: false,
      loading2: false
    }
  },
  setup() {
    const loading3 = ref(false)
    const onBtn3Click = () => {
      vueFetch({ url: 'https://www.163.com' }, loading3)
    }
    return { loading3, onBtn3Click }
  },
  methods: {
    onBtn1Click() {
      const setLoading = (bool) => (this.loading = bool)
      smartfetch.fetch({ url: 'https://www.163.com' }, { lock: setLoading })
    },
    onBtn2Click() {
      vueFetch.call(
        this,
        { url: 'https://api.github.com/repos/ant-design/ant-design' },
        'loading2'
      )
    }
  }
}

const flushFetch = (time = 0) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, time)
  })

describe('test lock method in vue3 component', () => {
  it('test lock property of vue instance by method', async () => {
    const wrapper = mount(SubmitBtns)
    /** before button click */
    const btn = wrapper.get('#btn1')
    expect(btn.text()).toBe('false')
    expect(wrapper.vm.loading).toBe(false)
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.loading).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(300)
    expect(wrapper.vm.loading).toBe(false)
    expect(btn.text()).toBe('false')
  })
  it('test vueFetch method export by vue-plugin, test string lock', async () => {
    const wrapper = mount(SubmitBtns)
    /** before button click */
    const btn = wrapper.get('#btn2')
    expect(btn.text()).toBe('false')
    expect(wrapper.vm.loading2).toBe(false)
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.loading2).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(3000)
    expect(wrapper.vm.loading2).toBe(false)
    expect(btn.text()).toBe('false')
  })
  it('test vueFetch method export by vue-plugin, test ref lock', async () => {
    const wrapper = mount(SubmitBtns)

    const btn = wrapper.get('#btn3')
    expect(btn.text()).toBe('false')
    expect(wrapper.vm.loading3).toBe(false)
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.loading3).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(500)
    expect(wrapper.vm.loading3).toBe(false)
    expect(btn.text()).toBe('false')
  })
})
