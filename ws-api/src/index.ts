import dotenvSafe from 'dotenv-safe'

dotenvSafe.load({ allowEmptyValues: true })

import './lifecycleHandlers'
import { App } from './App'
import settings from './settings'

const app = new App(settings)

app.start()
