// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'
import _, {get} from 'lodash'

// Components
import {Form, Input, Button} from '@influxdata/clockface'
import {Grid} from 'src/clockface'

// APIs
import {client} from 'src/utils/api'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import * as copy from 'src/shared/copy/notifications'

// Types
import {Links} from 'src/types/links'
import {Notification, NotificationFunc, AppState} from 'src/types'
import {
  Columns,
  InputType,
  ButtonType,
  ComponentSize,
  ComponentColor,
} from '@influxdata/clockface'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

export interface OwnProps {
  links: Links
  notify: (message: Notification | NotificationFunc) => void
}

interface State {
  username: string
  password: string
}

type Props = OwnProps & WithRouterProps

@ErrorHandling
class SigninForm extends PureComponent<Props, State> {
  public state: State = {
    username: '',
    password: '',
  }

  public render() {
    const {username, password} = this.state
    return (
      <Form onSubmit={this.handleSignIn}>
        <Grid>
          <Grid.Row>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Username">
                <Input
                  name="username"
                  value={username}
                  onChange={this.handleUsername}
                  size={ComponentSize.Medium}
                  autoFocus={true}
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Password">
                <Input
                  name="password"
                  value={password}
                  onChange={this.handlePassword}
                  size={ComponentSize.Medium}
                  type={InputType.Password}
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Footer>
                <Button
                  color={ComponentColor.Primary}
                  text="Sign In"
                  size={ComponentSize.Medium}
                  type={ButtonType.Submit}
                />
              </Form.Footer>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Form>
    )
  }

  private handleUsername = (e: ChangeEvent<HTMLInputElement>): void => {
    const username = e.target.value
    this.setState({username})
  }
  private handlePassword = (e: ChangeEvent<HTMLInputElement>): void => {
    const password = e.target.value
    this.setState({password})
  }

  private handleSignIn = async (): Promise<void> => {
    const {notify} = this.props
    const {username, password} = this.state

    try {
      await client.auth.signin(username, password)
      this.handleRedirect()
    } catch (error) {
      const message = get(error, 'response.data.msg', '')
      const status = get(error, 'response.status', '')

      if (status === 401) {
        return notify({
          ...copy.SigninError,
          message: 'Login failed: username or password is invalid',
        })
      }

      if (!message) {
        return notify(copy.SigninError)
      }

      notify({...copy.SigninError, message})
    }
  }

  private handleRedirect() {
    const {router} = this.props
    const {query} = this.props.location

    if (query && query.returnTo) {
      router.replace(query.returnTo)
    } else {
      router.push('/')
    }
  }
}

const mstp = ({links}: AppState) => ({
  links,
})

const mdtp = {
  notify: notifyAction,
}

export default connect(
  mstp,
  mdtp
)(withRouter(SigninForm))
