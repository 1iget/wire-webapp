/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import React from 'react';
import {
  Container,
  ContainerXS,
  Columns,
  Column,
  Form,
  InputSubmitCombo,
  Input,
  InputBlock,
  RoundIconButton,
  Checkbox,
  CheckboxLabel,
  H1,
  Text,
  Link,
  ArrowIcon,
  COLOR,
  ErrorMessage,
} from '@wireapp/react-ui-kit';
import ROUTE from '../route';
import {Link as RRLink} from 'react-router-dom';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import {parseError, parseValidationErrors} from '../util/errorUtil';
import {doLogin} from '../module/action/AuthAction';
import * as AuthSelector from '../module/selector/AuthSelector';
import ValidationError from '../module/action/ValidationError';
import {loginStrings} from '../../strings';
import RuntimeUtil from '../util/RuntimeUtil';
import * as URLUtil from '../util/urlUtil';
import BackendError from '../module/action/BackendError';

class Login extends React.PureComponent {
  inputs = {};

  state = {
    email: '',
    loginError: null,
    password: '',
    persist: true,
    validInputs: {
      email: true,
      password: true,
    },
    validationErrors: [],
  };

  handleSubmit = event => {
    event.preventDefault();
    if (this.props.isFetching) {
      return;
    }
    const validationErrors = [];
    const validInputs = this.state.validInputs;
    for (const inputKey of Object.keys(this.inputs)) {
      const currentInput = this.inputs[inputKey];
      if (!currentInput.checkValidity()) {
        validationErrors.push(ValidationError.handleValidationState(currentInput.name, currentInput.validity));
      }
      validInputs[inputKey] = currentInput.validity.valid;
    }
    this.setState({validInputs, validationErrors});
    return Promise.resolve(validationErrors)
      .then(errors => {
        if (errors.length) {
          throw errors[0];
        }
      })
      .then(() => {
        const {email, password, persist} = this.state;
        const login = {password, persist};
        if (email.indexOf('@') > 0) {
          login.email = email;
        } else {
          login.handle = email.replace('@', '');
        }
        return this.props.doLogin(login);
      })
      .then(() =>
        window.location.replace(`/${URLUtil.pathWithParams('login', `reason=login&persist=${this.state.persist}`)}`)
      )
      .catch(error => {
        if (error.label === BackendError.LABEL.TOO_MANY_CLIENTS) {
          this.props.history.push(ROUTE.CLIENTS);
        } else {
          throw error;
        }
      });
  };

  forgotPassword() {
    z.util.safe_window_open(z.util.URLUtil.build_url(z.util.URLUtil.TYPE.ACCOUNT, z.config.URL_PATH.PASSWORD_RESET));
  }

  render() {
    const {intl: {formatMessage: _}, loginError} = this.props;
    const {email, password, persist, validInputs, validationErrors} = this.state;
    return (
      <Container centerText verticalCenter style={{width: '100%'}}>
        <Columns>
          <Column style={{display: 'flex'}}>
            <div style={{margin: 'auto'}}>
              <Link to={ROUTE.INDEX} component={RRLink} data-uie-name="go-index">
                <ArrowIcon direction="left" color={COLOR.GRAY} />
              </Link>
            </div>
          </Column>
          <Column style={{flexBasis: 384, flexGrow: 0, padding: 0}}>
            <ContainerXS
              centerText
              style={{display: 'flex', flexDirection: 'column', height: 428, justifyContent: 'space-between'}}
            >
              <div>
                <H1 center>{_(loginStrings.headline)}</H1>
                <Text>{_(loginStrings.subhead)}</Text>
                <Form style={{marginTop: 30}}>
                  <InputBlock>
                    <Input
                      name="email"
                      onChange={event =>
                        this.setState({
                          email: event.target.value,
                          validInputs: {...validInputs, email: true},
                        })
                      }
                      innerRef={node => (this.inputs.email = node)}
                      markInvalid={!validInputs.email}
                      disabled={this.props.disableEmail}
                      value={email}
                      autoComplete="section-login email"
                      placeholder={_(loginStrings.emailPlaceholder)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          this.inputs.password.focus();
                        }
                      }}
                      maxLength="128"
                      type="text"
                      required
                      data-uie-name="enter-email"
                    />
                    <InputSubmitCombo>
                      <Input
                        name="password"
                        onChange={event =>
                          this.setState({
                            password: event.target.value,
                            validInputs: {...validInputs, password: true},
                          })
                        }
                        innerRef={node => (this.inputs.password = node)}
                        markInvalid={!validInputs.password}
                        value={password}
                        autoComplete="section-login password"
                        type="password"
                        placeholder={_(loginStrings.passwordPlaceholder)}
                        maxLength="1024"
                        minLength="8"
                        pattern=".{8,1024}"
                        required
                        data-uie-name="enter-password"
                      />
                      <RoundIconButton
                        disabled={!email || !password}
                        type="submit"
                        formNoValidate
                        onClick={this.handleSubmit}
                        data-uie-name="do-next"
                      />
                    </InputSubmitCombo>
                  </InputBlock>
                  {validationErrors.length ? (
                    parseValidationErrors(validationErrors)
                  ) : loginError ? (
                    <ErrorMessage data-uie-name="error-message">{parseError(loginError)}</ErrorMessage>
                  ) : null}
                  {!RuntimeUtil.isDesktop() && (
                    <Checkbox
                      onChange={event => this.setState({persist: !event.target.checked})}
                      checked={!persist}
                      data-uie-name="check-persist"
                      style={{justifyContent: 'center'}}
                    >
                      <CheckboxLabel>{_(loginStrings.publicComputer)}</CheckboxLabel>
                    </Checkbox>
                  )}
                </Form>
              </div>
              <Columns>
                <Column>
                  <Link onClick={this.forgotPassword}>{_(loginStrings.forgotPassword)}</Link>
                </Column>
                <Column>
                  <Link href={ROUTE.PHONE_LOGIN + window.location.search}>{_(loginStrings.phoneLogin)}</Link>
                </Column>
              </Columns>
            </ContainerXS>
          </Column>
          <Column />
        </Columns>
      </Container>
    );
  }
}

export default injectIntl(
  connect(
    state => ({
      isFetching: AuthSelector.isFetching(state),
      loginError: AuthSelector.getError(state),
    }),
    {doLogin}
  )(Login)
);
