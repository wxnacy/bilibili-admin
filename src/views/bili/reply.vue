<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="Title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.bili_name" placeholder="Bili" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in biliOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <el-select v-model="listQuery.season" placeholder="季" clearable class="filter-item" style="width: 130px" @change="episodeChange">
        <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <el-select v-model="extQuery.up_like" placeholder="是否点赞" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in [1, 0]" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="listQuery.sort" placeholder="Sort" style="width: 100px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-select v-model="makeParam.minute" placeholder="Minute" style="width: 100px" class="filter-item">
        <el-option v-for="item in minuteOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-link" @click="refresh">
        刷新最近
      </el-button>
      <el-button v-waves class="filter-item" type="success" icon="el-icon-link" @click="create">
        创建
      </el-button>
      <el-checkbox v-model="showReviewer" class="filter-item" style="margin-left:15px;" @change="tableKey=tableKey+1">
        reviewer
      </el-checkbox>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="130" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span class="link-type" @click="openItemJSON(row)">{{ row.rpid }}</span>
          <el-tag type="success" @click="openRealItemJSON(row)">真实</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Archive" min-width="80px">
        <template slot-scope="{row}">
          <!--<img class="pic-404__parent" :src="row.cover_url" :alt="row.title">-->
          <span class="link-type" @click="openArchiveJSON(row)">{{ row.title.substring(0, 20) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="评论人" min-width="40px">
        <template slot-scope="{row}">
          <!--<img class="pic-404__parent" :src="row.cover_url" :alt="row.title">-->
          <span class="link-type" @click="handleUpdate(row)">{{ row.member.uname }}</span>
          <el-tag :type="row.reply_control.followed | followedFilter">{{ row.identity }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Content" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" style="white-space: pre-wrap;" @click="handleUpdate(row)">{{ row.message }}</span>
          <el-tag v-if="row.reply_control.is_top" type="danger">置顶</el-tag>
          <el-tag v-if="row.up_action.reply" type="success">已回复</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="130" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button v-if="!row.action" type="success" size="mini" icon="el-icon-link" @click="likeReply(row, 1)">
            点赞
          </el-button>
          <el-button v-if="row.action" type="info" size="mini" icon="el-icon-link" @click="likeReply(row, 0)">
            去赞
          </el-button>
          <el-button v-if="!row.reply_control.is_top" type="success" size="mini" icon="el-icon-link" @click="topReply(row, 1)">
            置顶
          </el-button>
          <el-button v-if="row.reply_control.is_top" type="info" size="mini" icon="el-icon-link" @click="topReply(row, 0)">
            去顶
          </el-button>
          <el-button type="primary" size="mini" icon="el-icon-link" @click="handleUpdate(row)">
            回复
          </el-button>
          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="Title" prop="name">
          <el-input v-model="temp.member" />
        </el-form-item>
        <el-form-item label="Content" prop="name">
          <el-input v-model="temp.content" />
        </el-form-item>
        <el-form-item label="Reply">
          <el-input v-model="temp.reply" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" @keyup.enter.native="updateData()" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchPv } from '@/api/article'
import { fetchGet, openURL } from '@/api/request'
import { handleRes } from '@/api/bili'
import { constants } from '@/utils/common'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

const calendarTypeOptions = [
  { key: 1, display_name: '爱情公寓1' },
  { key: 2, display_name: '爱情公寓2' },
  { key: 3, display_name: '爱情公寓3' },
  { key: 4, display_name: '爱情公寓4' },
  { key: 5, display_name: '爱情公寓5' },
  { key: 6, display_name: '大电影' },
  { key: 7, display_name: '番外篇' }
]

// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    followedFilter(isFollow) {
      if (isFollow) {
        return 'success'
      } else {
        return 'info'
      }
    },
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: constants.DEFAULT_QUERY,
      extQuery: {
        up_like: undefined
      },
      makeParam: {
        minute: 30
      },
      minuteOptions: [
        30, 60
      ],
      episodeOptions: [
      ],
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [
        /* { label: 'Order Asc', key: '+order' }, */
        /* { label: 'O Desc', key: '-used_times' } */
        /* { label: 'Use Asc', key: '+used_times' }, */
        { label: 'View Desc', key: '-view' }
      ],
      biliOptions: constants.BILI_OPTIONS,
      statusOptions: ['all', 'pubed', 'not_pubed'],
      showReviewer: false,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published',
        Archive: {
          title: '',
          reject_reason: ''
        }
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      var query = this.listQuery
      query.up_like = this.extQuery.up_like
      fetchGet('/reply', query).then(response => {
        const data = response.data.data
        this.list = []
        data.replys.forEach(reply => {
          var content = ''
          if (reply.root_info !== undefined && reply.root_info !== null) {
            content += `原评论 ${reply.root_info.member.uname}: \n\t${reply.root_info.content.message}\n\n`
          }
          if (reply.parent_info !== undefined && reply.parent_info !== null && reply.parent_info.rpid !== reply.root_info.rpid) {
            content += `回复评论 ${reply.parent_info.member.uname}: \n\t${reply.parent_info.content.message}\n\n`
          }
          content += `${reply.content.message}`
          reply.message = content
          if (reply.reply_control.followed) {
            reply.identity = '粉丝'
          } else {
            reply.identity = '路人'
          }
          this.list.push(reply)
        })
        this.total = data.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    refresh() {
      this.listLoading = true
      fetchGet('/reply/refresh', { bili_name: this.listQuery.bili_name }).then(response => {
        this.getList()
      })
    },
    create() {
      openURL(`/season/create`, { 'bili_name': this.listQuery.bili_name, 'title': this.listQuery.title })
    },
    openItemJSON(row) {
      openURL(`/reply/${row.rpid}.json`, { 'bili_name': this.listQuery.bili_name })
    },
    openRealItemJSON(row) {
      openURL(`/reply/real/${row.rpid}.json`, { 'bili_name': this.listQuery.bili_name })
    },
    openArchiveJSON(row) {
      openURL(`/archive/${row.bvid}.json`, { 'bili_name': this.listQuery.bili_name })
    },
    sortSeason(row) {
      openURL(`/season/${row.id}/sort`, { 'bili_name': this.listQuery.bili_name })
    },
    likeReply(row, action) {
      fetchGet('/reply/like', { bili_name: this.listQuery.bili_name, rpid: row.rpid, action: action }).then(response => {
        console.log(response.data)
        const data = response.data
        if (data.code === 0) {
          row.action = action
          this.$notify({
            title: 'Success',
            message: 'Created Successfully',
            type: 'success',
            duration: 2000
          })
        }
      })
    },
    topReply(row, action) {
      fetchGet('/reply/top', {
        bili_name: this.listQuery.bili_name,
        rpid: row.rpid,
        action: action
      }).then(response => {
        handleRes(response, this, function(self, res) {
          row.reply_control.is_top = action === 1
        }, function(self, res) { })
      })
    },
    episodeChange() {
      this.episodeOptions = []
      fetchGet('/episode', { season: this.listQuery.season, pagesize: 30 }).then(response => {
        const data = response.data
        const episodes = data.data.items
        episodes.forEach(ep => {
          this.episodeOptions.push({
            key: ep.id,
            display_name: ep.name
          })
        })
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        rpid: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: '',
        message: '',
        reply: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
        }
      })
    },
    preview(row) {
      fetchGet('/open', { 'path': row.path })
    },
    showInFinder(row) {
      fetchGet('/show-in-finder', { 'path': row.path })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          const data = {
            bili_name: this.listQuery.bili_name,
            rpid: tempData.rpid,
            message: tempData.reply,
            oid: tempData.oid
          }
          fetchGet('/reply/add', data).then(response => {
            handleRes(response, this, function(self, res) {
              self.dialogFormVisible = false
            }, function(self, res) {
              /* this.dialogFormVisible = false */
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      fetchGet('/reply/del', { bili_name: this.listQuery.bili_name, rpid: row.rpid }).then(response => {
        console.log(response.data)
        const data = response.data
        if (data.code === 0) {
          this.list.splice(index, 1)
          this.$notify({
            title: 'Success',
            message: 'Created Successfully',
            type: 'success',
            duration: 2000
          })
        }
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = ['timestamp', 'title', 'type', 'importance', 'status']
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    parseTime(val) {
      return parseTime(val)
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
