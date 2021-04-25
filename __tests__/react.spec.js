/* eslint-env node, jest */
import React from 'react'
import Enzyme, { shallow, render, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import smartfetch from '../'

Enzyme.configure({ adapter: new Adapter() });

window.alert = jest.fn();

class SubmitBtns extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      a: {}
    }
    this.$fetch = smartfetch.fetch.bind(this)
  }
  onBtn1Click = () => {
    this.$fetch('https://api.github.com/repos/ant-design/ant-design').lock('loading')
    console.log(this.state)
  }
  onBtn2Click = () => {
    this.$fetch('https://api.github.com/repos/ant-design/ant-design').lock('a.loading')
    console.log(this.state)
  }
  render() {
    return (<div>
      <button id="btn1" onClick={this.onBtn1Click}>{this.state.loading ? 'true' : 'false'}</button>
      <button id="btn2" onClick={this.onBtn2Click}>{this.state.a.loading ? 'true' : 'false'}</button>
    </div>)
  }
}

const flushFetch = (time = 0) => new Promise((resolve) => {
  setTimeout(resolve, time)
})

describe('test lock method in class style react component', () => {
  it('test lock root property of state', async () => {
    const wrapper = shallow(<SubmitBtns />)
    /** before button click */
    const btn = wrapper.find('#btn1')
    expect(btn.text()).toBe('false')
    expect(wrapper.state('loading')).toBe(false)
    // button click and fetch sending
    wrapper.instance().onBtn1Click()
    wrapper.update()
    expect(wrapper.state('loading')).toBe(true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(300)
    expect(wrapper.state('loading')).toBe(false)
    expect(btn.text()).toBe('false')
  })

  it.only('test lock nested object\'s property(whether may no exists) of vue instance', async () => {
    const wrapper = shallow(<SubmitBtns />)
    /** before button click */
    const btn = wrapper.find('#btn2')
    expect(btn.text()).toBe('false')
    expect(wrapper.state('a')).not.toHaveProperty('loading')
    // button click and fetch sending
    wrapper.instance().onBtn2Click()
    wrapper.update()
    expect(wrapper.state('a')).toHaveProperty('loading', true)
    expect(btn.text()).toBe('true')
    // after sending back
    await flushFetch(300)
    expect(wrapper.state('a')).toHaveProperty('loading', false)
    expect(btn.text()).toBe('false')
    console.log(wrapper.state())
  })

})