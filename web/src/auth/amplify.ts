import { Amplify } from 'aws-amplify'
import config from '../aws-config.json'

let configured = false

export function configureAmplify() {
  if (configured) return
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          email: true,
          oauth: {
            domain: `${config.hostedUiDomain}.auth.${config.region}.amazoncognito.com`,
            scopes: ['email', 'openid', 'profile'],
            redirectSignIn: [window.location.origin + '/'],
            redirectSignOut: [window.location.origin + '/'],
            responseType: 'code',
            providers: ['Google'],
          },
        },
      },
    },
  })
  configured = true
}

export const awsConfig = config
