import React, { Children } from 'react'
import PropTypes from 'prop-types'

import filterReactProps from '@pluralsight/ps-design-system-filter-react-props'
import Icon from '@pluralsight/ps-design-system-icon/react.js'
import { BelowLeft } from '@pluralsight/ps-design-system-position/react.js'
import { elementOfType } from '@pluralsight/ps-design-system-prop-types'
import TextInput from '@pluralsight/ps-design-system-textinput/react.js'

import * as vars from '../vars/index.js'

import SuggestionsMenu from './menu.js'
import useOnDocumentClick from './use-on-document-click.js'
import usePortal from './use-portal.js'
import { combineFns, omit, pick } from './utils.js'

const TEXT_INPUT_PROPS = [
  'appearance',
  'disabled',
  'error',
  'label',
  'name',
  'onChange',
  'placeholder',
  'subLabel',
  'value'
]
const Typeahead = React.forwardRef((props, forwardedRef) => {
  const { children, filterFn, onChange, value } = props

  const portal = usePortal()
  const containerRef = React.useRef()

  const fieldRef = React.useRef()
  const inputRef = React.useRef()
  React.useImperativeHandle(forwardedRef, () => inputRef.current)

  const [controlled] = React.useState(typeof value !== 'undefined')
  const [open, setOpen] = React.useState(false)

  const [innerValue, setInnerValue] = React.useState(value || '')
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(
    function updateControlledValue() {
      if (controlled) setInnerValue(value)
    },
    [controlled, value]
  )

  React.useEffect(
    function clearSearchTermOnClose() {
      if (!open) setSearchTerm('')
    },
    [open]
  )

  useOnDocumentClick(evt => {
    const isInnerClick =
      !containerRef.current ||
      containerRef.current.contains(evt.target) ||
      portal.current.contains(evt.target)

    if (isInnerClick) return

    setOpen(false)
  })

  const suggestions = React.useMemo(() => {
    const childArray = Children.toArray(children)
    return childArray.map((child, index) => ({
      index,
      label: getSuggestionLabel(child),
      value: getSuggestionValue(child)
    }))
  }, [children])

  const filteredSuggestions = React.useMemo(
    () => filterFn(searchTerm, suggestions),
    [filterFn, searchTerm, suggestions]
  )

  const handleChange = (evt, nextValue) => {
    setSearchTerm(nextValue)

    if (!controlled) setInnerValue(nextValue)
    if (onChange) onChange(evt, nextValue)
  }

  const handleInputFocus = combineFns(evt => {
    setOpen(true)
  }, props.onFocus)

  const handleInputChange = evt => {
    const nextValue = evt.target.value

    handleChange(evt, nextValue)
  }

  const handleSuggestionMenuChange = (evt, nextValue) => {
    setOpen(false)
    handleChange(evt, nextValue)
  }

  return (
    <div
      {...filterReactProps(omit(props, TEXT_INPUT_PROPS))}
      ref={containerRef}
    >
      <BelowLeft
        inNode={portal.current}
        when={open}
        show={
          <SuggestionsMenu
            activeValue={innerValue}
            onChange={handleSuggestionMenuChange}
            suggestions={filteredSuggestions}
          />
        }
        target={fieldRef}
      >
        <TextInput
          {...pick(props, TEXT_INPUT_PROPS)}
          iconAlign={TextInput.iconAligns.right}
          icon={<Icon id={Icon.ids.caretDown} />}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          ref={{ field: fieldRef, input: inputRef }}
          value={innerValue}
        />
      </BelowLeft>
    </div>
  )
})

const Suggestion = React.forwardRef((props, forwardedRef) => {
  return <div ref={forwardedRef} {...props} />
})

Suggestion.propTypes = {
  children: PropTypes.string.isRequired,
  value: PropTypes.string
}

Typeahead.propTypes = {
  appearance: PropTypes.any,
  children: PropTypes.oneOfType([
    elementOfType(Suggestion),
    PropTypes.arrayOf(elementOfType(Suggestion))
  ]),
  disabled: PropTypes.any,
  error: PropTypes.any,
  filterFn: PropTypes.func,
  label: PropTypes.any,
  loading: PropTypes.bool,
  name: PropTypes.any,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.any,
  subLabel: PropTypes.any,
  value: PropTypes.string
}
Typeahead.defaultProps = {
  filterFn: filterSuggestions
}

Typeahead.appearances = vars.appearances

Typeahead.Suggestion = Suggestion

export const appearances = vars.appearances

export default Typeahead

function getSuggestionLabel(sug) {
  return sug.props.children
}

function getSuggestionValue(sug) {
  return sug.props.value || sug.props.children
}

function filterSuggestions(searchTerm, children) {
  if (!searchTerm || searchTerm.length <= 1) return children

  const term = searchTerm.toLowerCase()
  const matches = ({ label, value }) => {
    return (
      label.toLowerCase().includes(term) || value.toLowerCase().includes(term)
    )
  }

  return children.filter(matches)
}
