<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="Title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.bili_name" placeholder="Bili" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in biliOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <AlbumOption v-model="listQuery" />
      <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
        Export
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
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.title }}</span>
          <el-tag @click="showInFinder(row.path)">剧集</el-tag>
          <el-tag @click="preview(row.part_source_dir)">切片</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="管理稿件" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" style="white-space: pre-wrap;" @click="handleUpdate(row)">{{ row.archiveTitle }}</span>
        </template>
      </el-table-column>
      <el-table-column label="BED" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.bed }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="episodeSplit(row)">
            Split
          </el-button>
          <el-button type="primary" size="mini" @click="episodePartMake(row)">
            片段创建
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
import { loadAlbumOptions, loadAlbumSeasonOptions, openPath, showInFinder } from '@/api/bili'
import { constants } from '@/utils/common'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import AlbumOption from './components/album-option' // secondary package based on el-pagination

const calendarTypeOptions = [
  { key: 1, display_name: '爱情公寓1' },
  { key: 2, display_name: '爱情公寓2' },
  { key: 3, display_name: '爱情公寓3' },
  { key: 4, display_name: '爱情公寓4' }
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
        pagesize: 30,
        importance: undefined,
        name: undefined,
        type: undefined,
        season: undefined,
        manage_name: constants.DEFAULT_MANAGE_NAME,
        bili_name: constants.DEFAULT_BILI_NAME,
        sort: '+id'
      },
      manages: [],
      seasons: [],
      episodes: [

      ],
      albumOptions: null,
      biliOptions: constants.BILI_OPTIONS,
      albumSeasonOptions: null,
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
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
    this.albumChange()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchGet('/episode', this.listQuery).then(response => {
        const data = response.data
        this.list = []
        data.data.episodes.forEach(ep => {
          var archName = ''
          for (let index = 0; index < ep.archives.length; index++) {
            const arch = ep.archives[index]
            archName += `${index} ${arch.Archive.title} ${arch.Archive.state}\n`
          }
          ep.archiveTitle = archName
          this.list.push(ep)
        })
        this.total = data.data.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    albumChange() {
      console.log('change', this.listQuery)
      loadAlbumSeasonOptions(this)
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
      console.log(this.listQuery.manage_name)
      /* this.resetTemp() */
      /* this.dialogStatus = 'create' */
      /* this.dialogFormVisible = true */
      /* this.$nextTick(() => { */
      /* this.$refs['dataForm'].clearValidate() */
      /* }) */
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
    preview(path) {
      openPath(path)
    },
    showInFinder(path) {
      showInFinder(path)
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
    episodeSplit(row) {
      var data = {
        manage_name: this.listQuery.manage_name,
        bili_name: this.listQuery.bili_name,
        episode_id: row.id
      }

      openURL('http://localhost:8006/episode/split', data)
    },
    episodePartMake(row) {
      var data = {
        manage_name: this.listQuery.manage_name,
        bili_name: this.listQuery.bili_name,
        episode_id: row.id
      }

      openURL('http://localhost:8006/episode/part/make', data)
    },
    handleSplit(row) {
      var data = {
        manage_name: this.listQuery.manage_name,
        bili_name: this.listQuery.bili_name,
        episode_id: row.id
      }
      data.path = row.path
      if (this.listQuery.bili_name === 'ipart') {
        data.prefix = `${row.album}${row.season}.${row.ep}`
        data.count = 2
        if (this.listQuery.manage_name === 'ipartment') {
          if (this.listQuery.season === 3) {
            data.is_remove_bed = false
          }
        }
        data.use_custom_title = true
      } else if (this.listQuery.bili_name === 'xinxin') {
        if (this.listQuery.manage_name === 'ipartment') {
          data.count = 6
        }
      } else if (this.listQuery.bili_name === 'wen') {
        data.prefix = `【${row.album}】${row.season}季${row.ep}集`
        data.count = 3
        if (this.listQuery.manage_name === 'ipartment') {
          if (this.listQuery.season === 3) {
            data.is_remove_bed = false
          }
        }
        data.use_custom_title = true
      }

      openURL('/episode/split', data)
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
