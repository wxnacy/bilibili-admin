import { fetchGet } from '@/api/request'

export function getAlbums() {
  return fetchGet('/album')
}

export function getAlbumSeasons(albumId) {
  return fetchGet(`/album/${albumId}/season`)
}

export function getAuthUsers() {
  return fetchGet('/api/auth/user')
}

export function openPath(path) {
  return fetchGet('/open', { 'path': path })
}

export function showInFinder(path) {
  return fetchGet('/show-in-finder', { 'path': path })
}

export function handleRes(res, self, succFunc, failFunc) {
  console.log(res.data)
  const data = res.data
  if (data.code === 0) {
    self.$notify({
      title: 'Success',
      message: 'Created Successfully',
      type: 'success',
      duration: 2000
    })
    console.log(succFunc)
    if (succFunc) {
      console.log(succFunc)
      succFunc(self, res)
    }
  } else {
    self.$notify({
      title: 'Failed',
      message: data.message,
      type: 'danger',
      duration: 2000
    })
    if (failFunc) {
      failFunc(self, res)
    }
  }
}

export function getAllSeasons(userId) {
  return fetchGet(`/season`, { 'bili_name': userId, 'pagesize': 50 })
}

export function loadSeasonOptions(self) {
  fetchGet(`/season`, {
    'bili_name': self.listQuery.bili_name, 'pagesize': 50
  }).then(res => {
    self.seasonOptions = res.data.data.seasons
  })
}

export function loadAlbumOptions(self) {
  getAlbums().then(res => {
    self.albumOptions = res.data.data.albums
  })
}

export function loadAlbumSeasonOptions(self) {
  getAlbumSeasons(self.listQuery.manage_name).then(res => {
    self.albumSeasonOptions = res.data.data.seasons
  })
}

export function loadEpisodeOptions(self) {
  fetchGet('/episode', {
    season: self.listQuery.season,
    pagesize: 90
  }).then(response => {
    const data = response.data
    const episodes = data.data.episodes
    self.episodeOptions = episodes
  })
}

export function loadAuthOptions(self) {
  getAuthUsers().then(res => {
    self.authOptions = res.data.data.data
  })
}
