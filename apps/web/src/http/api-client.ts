import ky from 'ky'

export const api = ky.create({
  prefix: 'http://localhost:3333',
})
