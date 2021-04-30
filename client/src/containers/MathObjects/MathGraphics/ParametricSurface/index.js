// @flow
import React, { PureComponent } from 'react'
import {
  ParametricSurface as ParametricSurfaceGraphic,
  ExplicitSurface as ExplicitSurfaceGraphic,
  ExplicitSurfacePolar as ExplicitSurfacePolarGraphic
} from 'components/MathBox'
import MathGraphic from '../MathGraphic'
import MathGraphicUI from '../containers/MathGraphicUI'
import ParametricSurfaceStatus from './containers/ParametricSurfaceStatus'
import {
  parametricSurfaceMeta,
  explicitSurfaceMeta,
  explicitSurfacePolarMeta
} from '../metadata'
import type { MetaData } from '../types'
import { MainRow } from 'containers/MathObjects/components'
import {
  MathInputRHS,
  StaticMathStyled
} from 'containers/MathObjects/containers/MathInput'
import { parser } from 'constants/parsing'
import { setProperty } from '../../actions'
import { getMathObjectProp } from '../../containers/MathInput/selectors'
import { Button, Dropdown, Menu } from 'antd'
import styled from 'styled-components'
import { connect } from 'react-redux'

type Props = {
  id: string,
  expr: string,
  rangeU: string,
  rangeV: string,
  labelU: string,
  labelV: string,
  labelW: string,
  dispatch: ({ type: string, name: string, payload: { id: string, property: string, value: string} }) => void
}

const justifyRight = {
  justifyContent: 'flex-end'
}

const noFlex = {
  flex: 0
}

const DropdownButton = styled(Button)`
  align-self: center;
  font-weight: bold;
  &.ant-btn, &.ant-btn:hover, &.ant-btn:focus {
    padding-left: 11.5px;
    padding-right: 11.5px;
    background: linear-gradient(
      ${props => props.theme.gray[1]},
      ${props => props.theme.gray[4]}
    );
  }
`

function makeStripFuncPrefix(varname: string) {
  const prefixLength = `_f(${varname})=`.length
  return function stripFuncPrefixIfPossible(latex: string): string {
    try {
      const full = parser.parse(latex)
      if (full.tree.type !== 'FunctionAssignmentNode') {
        return latex
      }
      const varname = full.tree.params[0]
      const texRHS = latex.slice(prefixLength)
      const rhs = parser.parse(texRHS)
      return rhs.dependencies.has(varname) ? latex : texRHS
    }
    catch (error) {
      return latex
    }
  }
}

function makeSurfaceComponent(type: string, meta: MetaData, labelU: string, labelV: string, labelW: string) {

  const labelArray = [labelU, labelV, labelW]

  return class ParametricSurfaceUI extends PureComponent<Props> {

    handleExplicitVarChange = ({ key } : { key: string }) => {
      if (this.props.labelW !== key) {
        let keyIndex = labelArray.indexOf(key);
        let indexOne = (keyIndex + 1) % 3
        let indexTwo = (keyIndex + 2) % 3

        if (indexOne > indexTwo) {
          let temp = indexOne
          indexOne = indexTwo
          indexTwo = temp
        }

        let newExpr = ` ${this.props.expr} `;
        if (this.props.labelU === labelArray[indexTwo]) {
          newExpr = newExpr
              .replaceAll(new RegExp(`([^A-Za-z])${this.props.labelU}([^A-Za-z])`, 'g'), `$1${labelArray[indexOne]}$2`)
              .replaceAll(new RegExp(`([^A-Za-z])${this.props.labelV}([^A-Za-z])`, 'g'), `$1${labelArray[indexTwo]}$2`)
        } else {
          newExpr = newExpr
              .replaceAll(new RegExp(`([^A-Za-z])${this.props.labelV}([^A-Za-z])`, 'g'), `$1${labelArray[indexTwo]}$2`)
              .replaceAll(new RegExp(`([^A-Za-z])${this.props.labelU}([^A-Za-z])`, 'g'), `$1${labelArray[indexOne]}$2`)
        }

        newExpr = newExpr.substring(1, newExpr.length - 1)

        this.props.dispatch(
            setProperty(this.props.id, EXPLICIT_SURFACE, 'expr', newExpr)
        )

        if (this.props.labelU !== labelArray[indexOne]) {
          this.props.dispatch(
              setProperty(this.props.id, EXPLICIT_SURFACE, 'labelU', labelArray[indexOne])
          )
        }

        if (this.props.labelV !== labelArray[indexTwo]) {
          this.props.dispatch(
              setProperty(this.props.id, EXPLICIT_SURFACE, 'labelV', labelArray[indexTwo])
          )
        }

        this.props.dispatch(
            setProperty(this.props.id, EXPLICIT_SURFACE, 'labelW', key)
        )
      }
    }

    renderDropdown = () => {
      return (
          <Menu
              onClick={this.handleExplicitVarChange}
          >
            <Menu.Item key={labelU}>{labelU}</Menu.Item>
            <Menu.Item key={labelV}>{labelV}</Menu.Item>
            <Menu.Item key={labelW}>{labelW}</Menu.Item>
          </Menu>
      )
    }

    render() {
      const { id, labelU, labelV, labelW } = this.props

      const stripFuncPrefixIfPossibleU = makeStripFuncPrefix(labelU)
      const stripFuncPrefixIfPossibleV = makeStripFuncPrefix(labelV)

      let metadata = {...meta}
      if (type === EXPLICIT_SURFACE) {
        metadata.uSamples.label = `${labelU} samples`
        metadata.vSamples.label = `${labelV} samples`
        metadata.gridU.label = `${labelU} gridlines`
        metadata.gridV.label = `${labelV} gridlines`
      }

      return (
        <MathGraphicUI
          type={type}
          id={id}
          metadata={metadata}
          sidePanelContent={
            <ParametricSurfaceStatus
              id={id}
              labelU={labelU}
              labelV={labelV}
            />
          }
        >
          <MainRow>
            {type !== EXPLICIT_SURFACE ? null :
              <>
                <Dropdown
                  style={noFlex}
                  overlay={this.renderDropdown}
                  trigger={['click']}
                >
                  <DropdownButton>
                    {labelW}
                  </DropdownButton>
                </Dropdown>
                <StaticMathStyled latex='='/>
              </>
            }
            <MathInputRHS
              field='expr'
              prefix={`_f(${labelU},${labelV})=`}
              parentId={id}
            />
          </MainRow>
          <MainRow style={justifyRight}>
            <StaticMathStyled latex={`${labelU}\\in`} size='small'/>
            <MathInputRHS
              size='small'
              parentId={id}
              prefix={`_f(${labelV})=`}
              postProcessLaTeX={stripFuncPrefixIfPossibleV}
              field='rangeU'
              style={noFlex}
            />
          </MainRow>
          <MainRow style={justifyRight}>
            <StaticMathStyled latex={`${labelV}\\in`} size='small'/>
            <MathInputRHS
              size='small'
              parentId={id}
              prefix={`_f(${labelU})=`}
              postProcessLaTeX={stripFuncPrefixIfPossibleU}
              field='rangeV'
              style={noFlex}
            />
          </MainRow>
        </MathGraphicUI>
      )
    }

  }
}

export const PARAMETRIC_SURFACE = 'PARAMETRIC_SURFACE'
export const EXPLICIT_SURFACE = 'EXPLICIT_SURFACE'
export const EXPLICIT_SURFACE_POLAR = 'EXPLICIT_SURFACE_POLAR'

const mapStateToProps = ( { mathGraphics, mathSymbols, parseErrors, evalErrors, renderErrors }, ownProps) => {
  const { id } = ownProps
  const expr = getMathObjectProp([mathGraphics, mathSymbols], id, 'expr')
  const rangeU = getMathObjectProp([mathGraphics, mathSymbols], id, 'rangeU')
  const rangeV = getMathObjectProp([mathGraphics, mathSymbols], id, 'rangeV')
  const labelU = getMathObjectProp([mathGraphics, mathSymbols], id, 'labelU')
  const labelV = getMathObjectProp([mathGraphics, mathSymbols], id, 'labelV')
  const labelW = getMathObjectProp([mathGraphics, mathSymbols], id, 'labelW')

  return {
    expr: expr,
    rangeU: rangeU,
    rangeV: rangeV,
    labelU: labelU,
    labelV: labelV,
    labelW: labelW
  }
}

const ParametricSurfaceComponent = makeSurfaceComponent(PARAMETRIC_SURFACE, parametricSurfaceMeta, 'u', 'v')
const ConnectedParametricSurfaceComponent = connect(
    mapStateToProps
)(ParametricSurfaceComponent)

export const ParametricSurface = new MathGraphic( {
  type: PARAMETRIC_SURFACE,
  description: 'Parametric Surface',
  metadata: parametricSurfaceMeta,
  uiComponent: ConnectedParametricSurfaceComponent,
  mathboxComponent: ParametricSurfaceGraphic
} )

const ExplicitSurfaceComponent = makeSurfaceComponent(EXPLICIT_SURFACE, explicitSurfaceMeta, 'x', 'y', 'z')
const ConnectedExplicitSurfaceComponent = connect(
    mapStateToProps
)(ExplicitSurfaceComponent)

export const ExplicitSurface = new MathGraphic( {
  type: EXPLICIT_SURFACE,
  description: 'Explicit Surface',
  metadata: explicitSurfaceMeta,
  uiComponent: ConnectedExplicitSurfaceComponent,
  mathboxComponent: ExplicitSurfaceGraphic
} )

const ExplicitSurfacePolarComponent = makeSurfaceComponent(EXPLICIT_SURFACE_POLAR, explicitSurfacePolarMeta, 'r', '\\theta')
const ConnectedExplicitSurfacePolarComponent = connect(
    mapStateToProps
)(ExplicitSurfacePolarComponent)

export const ExplicitSurfacePolar = new MathGraphic( {
  type: EXPLICIT_SURFACE_POLAR,
  description: 'Explicit Surface (Polar)',
  metadata: explicitSurfacePolarMeta,
  uiComponent: ConnectedExplicitSurfacePolarComponent,
  mathboxComponent: ExplicitSurfacePolarGraphic
} )
