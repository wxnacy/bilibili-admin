/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const biliRouter = {
  path: '/bili',
  component: Layout,
  redirect: '/bili/dashboard',
  name: '切片 ',
  meta: {
    title: 'bilibili',
    icon: 'table'
  },
  children: [
    {
      path: '/dashboard',
      component: () => import('@/views/bili/dashboard/index'),
      name: '首页',
      meta: { title: '首页' }
    },
    {
      path: 'episode',
      component: () => import('@/views/bili/episode'),
      name: '列表',
      meta: { title: '剧集列表' }
    },
    {
      path: 'video-config',
      component: () => import('@/views/bili/video-config'),
      name: '视频配置',
      meta: { title: '视频配置' }
    },
    {
      path: 'part',
      component: () => import('@/views/bili/part'),
      name: '列表',
      meta: { title: '切片列表' }
    },
    {
      path: 'archive',
      component: () => import('@/views/bili/archive'),
      name: '稿件管理',
      meta: { title: '稿件管理' }
    },
    {
      path: 'season',
      component: () => import('@/views/bili/season'),
      name: '合集管理',
      meta: { title: '合集管理' }
    },
    {
      path: 'reply',
      component: () => import('@/views/bili/reply'),
      name: '评论管理',
      meta: { title: '评论管理' }
    },
    {
      path: 'income-chart',
      component: () => import('@/views/bili/income-chart'),
      name: '收入展示',
      meta: { title: '收入展示' }
    }
  ]
}
export default biliRouter
