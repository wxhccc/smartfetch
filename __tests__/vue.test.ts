import { vi, describe, it, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { winFetch, axiosFetch } from '../src'

window.alert = vi.fn()

const testApi = 'https://httpbin.org/get'

const SubmitBtns = defineComponent({
  setup() {
    const loading = ref(false)
    const loading2 = ref(false)
    const onBtn1Click = async () => {
      const setLoading = (bool: boolean) => { loading.value = bool }
      await winFetch(testApi, undefined, 'GET', { lock: setLoading })
    }
    const onBtn2Click = async () => {
      await axiosFetch<Record<string, any>>(
        { url: testApi },
        {
          lock: [loading2, 'value']
        }
      )
    }

    return { loading, loading2, onBtn1Click, onBtn2Click }
  },
  render() {
    return h('div', [
      h('button', { id: 'btn1', onClick: this.onBtn1Click }, this.loading),
      h('button', { id: 'btn2', onClick: this.onBtn2Click }, this.loading2)
    ])
  }
})

const flushFetch = (time = 0) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, time)
  })

describe('test lock method in vue3 component', () => {
  it('test lock property of vue instance by method with winFetch', async () => {
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
    await flushFetch(2000)
    expect(wrapper.vm.loading).toBe(false)
    expect(btn.text()).toBe('false')
  })

  it('test lock property of vue instance by Ref with axiosFetch', async () => {
    const wrapper = mount(SubmitBtns)

    const btn = wrapper.get('#btn2')
    expect(btn.text()).toBe('false')
    expect(wrapper.vm.loading2).toBe(false)
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.loading2).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(2000)
    expect(wrapper.vm.loading2).toBe(false)
    expect(btn.text()).toBe('false')
  })
})
