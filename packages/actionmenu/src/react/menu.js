// NOTE: proptypes linking Item is done in index.js to avoid circular menu-item dependency
/* eslint react/prop-types: 0 */

import { css } from 'glamor'
import filterReactProps from '@pluralsight/ps-design-system-filter-react-props'
import React from 'react'

import { calcNextIndex } from '../js/index.js'
import Overlay from './overlay.js'
import stylesheet from '../css/index.js'

const slide = css.keyframes(
  stylesheet['@keyframes psds-actionmenu__keyframes__slide']
)

const styles = {
  menu: props =>
    css(
      stylesheet['.psds-actionmenu']({ slide }),
      stylesheet[`.psds-actionmenu--origin-${props.origin}`],
      props._isNested &&
        stylesheet[
          `.psds-actionmenu--nested.psds-actionmenu--origin-${props.origin}`
        ],
      props.css
    )
}

const ActionMenu = React.forwardRef((props, forwardedRef) => {
  const ref = React.useRef()
  React.useImperativeHandle(forwardedRef, () => ref.current)

  const initialIndex = React.useMemo(() => {
    if (!props.shouldFocusOnMount) return -1

    return calcNextIndex(
      React.Children.map(props.children, c => c && c.props),
      1,
      -1
    )
  }, [props.children, props.shouldFocusOnMount])

  const [activeIndex, setActiveIndex] = React.useState(initialIndex)

  const [activeDirection, setActiveDirection] = React.useState('down')

  const [isKeyboarding, setIsKeyboarding] = React.useState(props.isKeyboarding)

  function handleKeyDown(evt) {
    if (evt.key === 'ArrowLeft' || evt.key === 'Escape') {
      navigateOut(evt)
    } else if (evt.key === 'ArrowDown') {
      navigate(evt, 'down')
    } else if (evt.key === 'ArrowUp') {
      navigate(evt, 'up')
    } else if (evt.key === 'Tab') {
      navigateTab(evt)
    }
  }

  function handleDividerFocus() {
    if (activeDirection === 'down') {
      const newIndex = activeIndex + 1
      const itemsCount = React.Children.count(props.children)
      const nextActiveIndex =
        newIndex > itemsCount - 1 ? itemsCount - 1 : newIndex

      setActiveIndex(nextActiveIndex)
      setActiveDirection('down')
    } else if (activeDirection === 'up') {
      const newIndex = activeIndex - 1
      const nextActiveIndex = newIndex <= 0 ? 0 : newIndex

      setActiveIndex(nextActiveIndex)
      setActiveDirection('up')
    }
  }

  function focusItemAtIndex(index) {
    setActiveIndex(index)
  }

  function focusItemAtIndexWithMouse(index) {
    focusItemAtIndex(index)
    setIsKeyboarding(false)
  }

  function navigate(evt, direction) {
    evt.stopPropagation()
    evt.preventDefault()

    const nextActiveIndex = calcNextIndex(
      React.Children.map(props.children, c => c.props),
      direction === 'down' ? 1 : -1,
      activeIndex
    )

    setActiveDirection(direction)
    setActiveIndex(nextActiveIndex)
    setIsKeyboarding(true)
  }

  function navigateOut(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    if (typeof props.onClose === 'function') props.onClose(evt)
  }

  function navigateTab(evt) {
    const direction = evt.shiftKey ? 'up' : 'down'
    const lastIndex = React.Children.count(props.children) - 1
    const atEdge =
      (direction === 'up' && activeIndex === 0) ||
      (direction === 'down' && activeIndex === lastIndex)

    if (atEdge) navigateOut(evt)
    else navigate(evt, direction)
  }

  function handleChange(evt, value, label) {
    if (typeof props.onChange === 'function') props.onChange(evt, value, label)
  }

  return (
    <React.Fragment>
      {!props._isNested && typeof props.onClose === 'function' && (
        <Overlay onClose={navigateOut} />
      )}
      <div
        {...styles.menu(props)}
        {...filterReactProps(props)}
        ref={ref}
        onKeyDown={handleKeyDown}
        role="menu"
      >
        {React.Children.map(props.children, (child, i) =>
          child
            ? React.cloneElement(child, {
                isActive: i === activeIndex,
                shouldFocusOnMount: props.shouldFocusOnMount,

                _i: i,
                _isKeyboarding: isKeyboarding,
                _onDividerFocus: handleDividerFocus,
                _onItemFocus: focusItemAtIndex,
                _onMouseOver: focusItemAtIndexWithMouse,
                _onChange: handleChange,
                _origin: props.origin
              })
            : null
        )}
      </div>
    </React.Fragment>
  )
})

export default ActionMenu
