<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="Title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.bili_name" placeholder="Bili" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in biliOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <AlbumOption v-model="listQuery" />
      <el-select v-model="listQuery.sort" placeholder="Sort" style="width: 130px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-select v-model="makeParam.minute" placeholder="Minute" style="width: 100px" class="filter-item">
        <el-option v-for="item in minuteOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-link" @click="makeMixture('')">
        创建混合
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
          <span class="link-type" @click="openPartJSON(row)">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.name }}</span>
          <el-tag>{{ row.name | typeFilter }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="EP" min-width="50px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.episode_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时长" min-width="50px">
        <template slot-scope="{row}">
          <span>{{ row.info.dur }}</span>
        </template>
      </el-table-column>
      <el-table-column label="次数" min-width="30px">
        <template slot-scope="{row}">
          <span>{{ row.used_times }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Path" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="preview(row)">{{ row.path }}</span>
          <el-tag @click="showInFinder(row)">finder</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="130" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" icon="el-icon-link" @click="makeMixture(row.id)">
            Mix
          </el-button>
          <el-button type="primary" size="mini" icon="el-icon-link" @click="makeStory(row.id)">
            Story
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
          <el-input v-model="temp.name" @keyup.enter.native="updateData()" />
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
      calendarTypeOptions,
      manageOptions: [
        { display_name: '爱情公寓', key: 'ipartment' },
        { display_name: '喜剧大赛', key: 'yixi' },
        { display_name: '猫和老鼠', key: 'tom_jerry' },
        { display_name: '破事精英', key: 'lord_loser' },
        { display_name: '王牌对王牌', key: 'noge' },
        { display_name: '龙门镖局', key: 'longmen' }
      ],
      sortOptions: [
        { label: 'Order Asc', key: '+order' },
        { label: 'Order Desc', key: '-order' },
        { label: 'Use Asc', key: '+used_times' },
        { label: 'Use Desc', key: '-used_times' }
      ],
      biliOptions: [
        { display_name: 'wxnacy', key: 'wxnacy' },
        { display_name: '老温爱喝茶', key: 'wen' },
        { display_name: '四月的心', key: 'xinxin' },
        { display_name: '爱-爆笑', key: 'ipart' },
        { display_name: '菲菲剪辑', key: 'feifei' }
      ],
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
    /* this.listLoading = true */
    this.getList()
    /* this.fillManage() */
  },
  methods: {
    fillManage() {
      fetchGet('/manage', {}).then(response => {
        const data = response.data
        data.forEach(m => {
          this.manageOptions.push({
            display_name: m.title,
            key: m.id
          })
        })
        setTimeout(() => {
          /* this.listLoading = false */
        }, 1.5 * 1000)
      })
    },
    getList() {
      this.listLoading = true
      fetchGet('/part/list', this.listQuery).then(response => {
        const data = response.data
        this.list = data.data.items
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
    openPartJSON(row) {
      openURL(`/part/${row.id}.json`, { 'manage_name': this.listQuery.manage_name })
    },
    makeMixture(id) {
      const mName = this.listQuery.manage_name || 'ipartment'
      const url = `http://192.168.1.6:8006/part/mixture?bili_name=${this.listQuery.bili_name}&id=${id}&minute=${this.makeParam.minute}&manage_name=${mName}`
      window.open(url)
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
