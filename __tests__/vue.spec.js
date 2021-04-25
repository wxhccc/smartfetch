/* eslint-env node, jest */
import { mount } from '@vue/test-utils'
import smartfetch from '../'

window.alert = jest.fn()

const SubmitBtns = {
  template: `<div>
  <button id="btn1" @click="onBtn1Click">{{loading}}</button>
  <button id="btn2" @click="onBtn2Click">{{a.loading}}</button>
  </div>`,
  data() {
    return {
      loading: false,
      a: {}
    }
  },
  methods: {
    async onBtn1Click() {
      smartfetch.fetch.call(this, 'https://asfasf.afsf').lock('loading')
    },
    async onBtn2Click() {
      smartfetch.fetch.call(this, 'https://asfasf.afsf').lock('a.loading')
    }
  }
}

const flushFetch = (time = 0) =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

describe('test lock method in vue3 component', () => {
  it('test lock root property of vue instance', async () => {
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

  it("test lock nested object's property(whether may no exists) of vue instance", async () => {
    const wrapper = mount(SubmitBtns)
    /** before button click */
    const btn = wrapper.get('#btn2')
    expect(btn.text()).toBe('')
    expect(wrapper.vm.a).not.toHaveProperty('loading')
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.a).toHaveProperty('loading', true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(300)
    expect(wrapper.vm.a.loading).toBe(false)
    expect(btn.text()).toBe('false')
  })
})
