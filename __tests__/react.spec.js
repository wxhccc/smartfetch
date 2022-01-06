/* eslint-env node, jest */
import React from 'react'
import Enzyme, { shallow, render, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import smartfetch from '../'

Enzyme.configure({ adapter: new Adapter() })

window.alert = jest.fn()

class SubmitBtns extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      a: {}
    }
  }
  setLoading = (bool) => {
    this.setState({ loading: bool })
  }
  onBtn1Click = () => {
    smartfetch.fetch('https://sdfasfsdfas.sdfasdfa', undefined, 'GET', {
      lock: this.setLoading
    })
    console.log(this.state)
  }
  render() {
    return (
      <div>
        <button id="btn1" onClick={this.onBtn1Click}>
          {this.state.loading ? 'true' : 'false'}
        </button>
      </div>
    )
  }
}

const flushFetch = (time = 0) =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

describe('test lock method in class style react component', () => {
  it('test lock root property of state', async () => {
    const wrapper = shallow(<SubmitBtns />)
    const btn = () => wrapper.find('#btn1')
    /** before button click */
    expect(btn().text()).toBe('false')
    expect(wrapper.state('loading')).toBe(false)
    // button click and fetch sending
    wrapper.instance().onBtn1Click()
    await flushFetch(0)
    wrapper.update()
    expect(wrapper.state('loading')).toBe(true)
    expect(btn().text()).toBe('true')
    // after sending back
    await flushFetch(300)
    expect(wrapper.state('loading')).toBe(false)
    expect(btn().text()).toBe('false')
  })
})
