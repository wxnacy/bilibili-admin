<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="Title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.bili_name" placeholder="Bili" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in biliOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <AlbumOption v-model="listQuery" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
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
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="90" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span class="link-type" @click="openConfigJSON(row)">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="100px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Parts" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" style="white-space: pre-wrap;" @click="handleUpdate(row)">{{ row.partText }}</span>
        </template>
      </el-table-column>
      <el-table-column label="使用后缀" min-width="50px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.with_random_suffix }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="130" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" icon="el-icon-link" @click="makeConfig(row)">
            Make
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="Title" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="temp.remark" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" />
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
import { loadAlbumOptions } from '@/api/bili'
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
      listQuery: {
        page: 1,
        pagesize: 20,
        importance: undefined,
        name: undefined,
        title: undefined,
        type: undefined,
        season: undefined,
        episode: undefined,
        manage_name: constants.DEFAULT_MANAGE_NAME,
        bili_name: constants.DEFAULT_BILI_NAME,
        sort: undefined
      },
      makeParam: {
        minute: 30
      },
      minuteOptions: [
        30, 60
      ],
      albumOptions: null,
      episodeOptions: [
      ],
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [
        { label: 'Order Asc', key: '+order' },
        { label: 'Order Desc', key: '-order' },
        { label: 'Use Asc', key: '+used_times' },
        { label: 'Use Desc', key: '-used_times' }
      ],
      biliOptions: constants.BILI_OPTIONS,
      statusOptions: ['published', 'draft', 'deleted'],
      showReviewer: false,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
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
    loadAlbumOptions(this)
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchGet('/video/config', this.listQuery).then(response => {
        const data = response.data
        this.list = []
        data.data.configs.forEach(config => {
          var partText = ''
          config.parts.forEach(part => {
            partText += `${part.id} ${part.name}\n`
          })
          config.partText = partText
          this.list.push(config)
        })
        this.total = data.data.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    episodeChange() {
      this.episodeOptions = []
      fetchGet('/episode', { season: this.listQuery.season, pagesize: 30 }).then(response => {
        const data = response.data
        const episodes = data.data.episodes
        episodes.forEach(ep => {
          this.episodeOptions.push({
            key: ep.ep,
            display_name: ep.title
          })
        })
      })
    },
    makeConfig(row) {
      const data = {
        id: row.id,
        manage_name: this.listQuery.manage_name,
        bili_name: this.listQuery.bili_name
      }
      openURL('http://localhost:8006/video/config/make', data)
    },
    makeStory(id) {
      const mName = this.listQuery.manage_name || 'ipartment'
      const url = `http://192.168.1.6:8006/part/story?bili_name=${this.listQuery.bili_name}&id=${id}&manage_name=${mName}`
      window.open(url)
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    openConfigJSON(row) {
      openURL(`/video/config/${row.id}.json`, { 'bili_name': this.listQuery.bili_name })
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
          fetchPost('/part', tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
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
