import axios from 'axios'
import { constants } from '@/utils/common'
// import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  baseURL: constants.BASE_URL, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

export function fetchGet(url, query) {
  return service({
    url: url,
    method: 'get',
    params: query
  })
}

export function fetchPost(url, data) {
  return service({
    url: url,
    method: 'post',
    data
  })
}

export function openURL(path, params) {
  var uri = `${constants.BASE_URL}${path}`
  if (path.startsWith('http')) {
    uri = path
  }
  var url = new URL(uri)
  url.search = new URLSearchParams(params)
  window.open(url.toString())
}
