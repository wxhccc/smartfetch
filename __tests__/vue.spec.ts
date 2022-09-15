import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { winFetch, axiosFetch } from '../src'

window.alert = jest.fn()

const SubmitBtns = defineComponent({
  setup() {
    const loading = ref(false)
    const loading2 = ref(false)
    const onBtn1Click = () => {
      const setLoading = (bool: boolean) => (loading.value = bool)
      winFetch('https://www.163.com', undefined, 'GET', { lock: setLoading })
    }
    const onBtn2Click = () => {
      axiosFetch(
        { url: 'https://api.github.com/repos/ant-design/ant-design' },
        {
          lock: [loading2 as unknown as Record<string, boolean>, 'value']
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

  it('test vueFetch method export by vue-plugin, test ref lock', async () => {
    const wrapper = mount(SubmitBtns)

    const btn = wrapper.get('#btn2')
    expect(btn.text()).toBe('false')
    expect(wrapper.vm.loading2).toBe(false)
    // button click and fetch sending
    await btn.trigger('click')
    expect(wrapper.vm.loading2).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(1000)
    expect(wrapper.vm.loading2).toBe(false)
    expect(btn.text()).toBe('false')
  })
})
