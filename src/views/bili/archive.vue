<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.title" placeholder="Title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.bili_name" placeholder="Bili" clearable class="filter-item" style="width: 130px" @change="biliChange">
        <el-option v-for="item in biliOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <el-select v-model="listQuery.season_title" placeholder="合集" clearable class="filter-item" style="width: 130px" @change="seasonChange">
        <el-option v-for="item in seasonOptions" :key="item.title" :label="item.title" :value="item.title" />
      </el-select>
      <AlbumOption v-model="listQuery" />
      <el-select v-model="listQuery.status" placeholder="Status" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
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
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-link" @click="refreshArchives">
        刷新最近
      </el-button>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-link" @click="refreshSeasonArchives">
        合集刷新
      </el-button>
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
          <span class="link-type" @click="openArchiveJSON(row)">{{ row.Archive.bvid }}</span>
          <el-tag type="success" @click="openArchiveRealJSON(row)">真实</el-tag>
          <el-tag type="success" @click="open(row.db_path)">打开</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.Archive.title.substring(0, 24) }}</span>
          <el-tag :type="row.Archive.state | stateFilter" @click="handleUpdate(row)">{{ row.Archive.state_desc }} {{ parseTime(row.Archive.dtime) }}</el-tag>
          <el-tag v-if="row.ext.history_id!=''" type="info" @click="openHistoryJSON(row)">构建记录</el-tag>
          <el-tag v-if="row.ext.history_id!=''" type="success" @click="openArchiveCardJSON(row)">导航</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合集" min-width="20px">
        <template slot-scope="{row}">
          <span class="link-type">{{ row.ext.season_title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Play" min-width="20px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.stat.view }}</span>
        </template>
      </el-table-column>
      <el-table-column label="like" min-width="30px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.stat.like }} ( {{ (row.stat.like / row.stat.view).toFixed(2) }} )</span>
        </template>
      </el-table-column>
      <el-table-column label="Ptime" min-width="50px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ parseTime(row.Archive.ptime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="130" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="success" size="mini" icon="el-icon-link" @click="submit_card(row)">
            导航
          </el-button>
          <el-button type="success" size="mini" icon="el-icon-link" @click="reply_card(row)">
            导评
          </el-button>
          <el-button type="primary" size="mini" icon="el-icon-link" @click="reply(row, '')">
            快评
          </el-button>
          <el-button type="success" size="mini" icon="el-icon-link" @click="refresh_ext(row)">
            刷新
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="Title" prop="name">
          <el-input v-model="temp.Archive.title" />
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="temp.Archive.reject_reason" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" />
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
import { fetchPv, createArticle } from '@/api/article'
import { fetchGet, fetchPost, openURL } from '@/api/request'
import { loadSeasonOptions, handleRes } from '@/api/bili'
import { constants } from '@/utils/common'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import AlbumOption from './components/album-option' // secondary package based on el-pagination

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
  components: { Pagination, AlbumOption },
  directives: { waves },
  filters: {
    stateFilter(state) {
      if (state === 0) {
        return 'success'
      } else if (state === -40) {
        return 'info'
      } else {
        return 'danger'
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
      makeParam: {
        minute: 30
      },
      minuteOptions: [
        30, 60
      ],
      episodeOptions: [
      ],
      importanceOptions: [1, 2, 3],
      seasonOptions: null,
      calendarTypeOptions,
      sortOptions: [
        /* { label: 'Order Asc', key: '+order' }, */
        /* { label: 'O Desc', key: '-used_times' } */
        /* { label: 'Use Asc', key: '+used_times' }, */
        { label: 'View Desc', key: '-view' }
      ],
      biliOptions: constants.BILI_OPTIONS,
      statusOptions: ['all', 'pubed', 'is_pubing', 'not_pubed'],
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
    this.biliChange()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchGet('/archive', this.listQuery).then(response => {
        const data = response.data.data
        this.list = data.archives
        this.total = data.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    biliChange() {
      loadSeasonOptions(this)
    },
    seasonChange() {
      this.getList()
    },
    refreshArchives() {
      this.listLoading = true
      fetchGet('/archive/refresh', { bili_name: this.listQuery.bili_name }).then(response => {
        this.getList()
      })
    },
    refreshSeasonArchives() {
      openURL(`http://localhost:8006/archive/refresh_by_season`, {
        'bili_name': this.listQuery.bili_name,
        'manage_name': this.listQuery.manage_name,
        'season_title': this.listQuery.season_title
      })
    },
    openArchiveJSON(row) {
      openURL(`/archive/${row.Archive.bvid}.json`, { 'bili_name': this.listQuery.bili_name })
    },
    openArchiveRealJSON(row) {
      openURL(`/archive/${row.Archive.bvid}.json`, { 'bili_name': this.listQuery.bili_name, 'is_remote': 1 })
    },
    openArchiveCardJSON(row) {
      openURL(`/archive/card/${row.Archive.bvid}.json`, { 'bili_name': this.listQuery.bili_name })
    },
    openHistoryJSON(row) {
      openURL(`/history/${row.ext.history_id}.json`, {})
    },
    replyAndTop(row) {
      fetchGet('/archive/reply/top', {
        bili_name: this.listQuery.bili_name,
        bvid: row.Archive.bvid
      }).then(response => {
        const data = response.data
        if (data.code === 0) {
          this.$notify({
            title: 'Success',
            message: 'Created Successfully',
            type: 'success',
            duration: 2000
          })
        }
      })
    },
    submit_card(row) {
      fetchGet('/archive/submit/card', {
        bili_name: this.listQuery.bili_name,
        bvid: row.Archive.bvid
      }).then(response => {
        handleRes(response, this, null, null)
      })
    },
    reply_card(row) {
      fetchGet('/archive/reply/card', {
        bili_name: this.listQuery.bili_name,
        bvid: row.Archive.bvid
      }).then(response => {
        handleRes(response, this, null, null)
      })
    },
    refresh_ext(row) {
      fetchGet('/archive/refresh/ext', {
        bili_name: this.listQuery.bili_name,
        manage_name: this.listQuery.manage_name,
        bvid: row.Archive.bvid
      }).then(res => {
        const index = this.list.findIndex(v => v.id === this.row.id)
        handleRes(res, this, (self, res) => {
          this.list.splice(index, 1, this.temp)
        }, null)
      })
    },
    reply(row, message) {
      fetchGet('/archive/reply', {
        bili_name: this.listQuery.bili_name,
        bvid: row.Archive.bvid,
        message: message
      }).then(response => {
        const data = response.data
        if (data.code === 0) {
          this.$notify({
            title: 'Success',
            message: 'Created Successfully',
            type: 'success',
            duration: 2000
          })
        }
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
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
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
          createArticle(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    open(path) {
      fetchGet('/open', { 'path': path })
    },
    preview(row) {
      fetchGet('/open', { 'path': row.path })
    },
    showInFinder(row) {
      fetchGet('/show-in-finder', { 'path': row.path })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
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
          /* tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464 */
          const data = {
            bvid: tempData.Archive.bvid,
            title: tempData.Archive.title
          }
          fetchPost(`/archive/update?bili_name=${this.listQuery.bili_name}`, data).then((res) => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            handleRes(res, this, (self, res) => {
              this.list.splice(index, 1, this.temp)
              this.dialogFormVisible = false
              console.log(res.data)
            }, null)
          })
        }
      })
    },
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
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
