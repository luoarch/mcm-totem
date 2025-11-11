import { Fragment } from 'react'
import { IntakeFlow } from './features/intake'
import { UpdateNotification } from './core/UpdateNotification'

function App() {
  return (
    <Fragment>
      <IntakeFlow />
      <UpdateNotification />
    </Fragment>
  )
}

export default App
