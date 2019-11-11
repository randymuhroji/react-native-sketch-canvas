import React, { Component } from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
import { toJS } from 'mobx'
import uuid from 'uuidv4'
import ImagePicker from 'react-native-image-crop-picker'
import PropTypes from 'prop-types'
import { Text, Icon } from '../common'
import styles from './styles'
import RNSketchCanvas from '@randymuhroji/react-native-sketch-canvas'
import { observer } from 'mobx-react'
import { Actions } from 'react-native-router-flux'
import { getContrast } from '../../utils/helper'
import { productStore, snackbarStore } from '../../stores'
import ActionSheet from 'react-native-actionsheet'

const IS_ANDROID = Platform.OS === 'android'

@observer
class SketchCanvas extends Component {
  _refRNSketch = null

  state = {
    defaultStrokeWidth: 2,
    editable: true,
  }

  editable = val => {
    this.setState({ editable: val })
  }

  save = () => {
    this._refRNSketch.save()
  }

  onSketchSaved = (result, path) => {
    if (result) {
      let image = {
        uri: path,
        type: 'image/png',
        name: String(Math.ceil(Math.random() * 100000000)),
      }
      productStore.current.image_markup = image

      if (this.props.goBack) {
        Actions.pop()
      } else {
        Actions.push('main__review_image')
      }
    } else {
      snackbarStore.show({ msg: 'Something error' })
    }
  }

  /**
   * type 0 = cameraxsw
   * type 1 = library
   */
  getImage = type => {
    let Image = type === 1 ? ImagePicker.openPicker : ImagePicker.openCamera
    Image({
      cropping: false,
      mediaType: 'photo',
      multiple: false,
      useFrontCamera: true,
      forceJpg: true,
    }).then(image => {
      let _image = {
        uri: IS_ANDROID ? image.path : image.path.replace('file://', ''),
        width: image.width,
        height: image.height,
        type: image.mime,
        name: image.filename || image.modificationDate || uuid(),
      }
      productStore.current.image = _image
      if (this.props.goBack) {
        productStore.current.image_markup = _image
      }
    })
  }

  getImageURL = image => {
    if (image && image.uri) {
      return image.uri.replace('file://', '')
    } else if (typeof image === 'string') {
      return `https://pipixel.herokuapp.com/` + image
    }
    return image
  }

  render() {
    const { defaultStrokeWidth, editable } = this.state
    const { goBack } = this.props
    let current = toJS(productStore.current)
    const image =
      !goBack && current.image_markup ? current.image_markup : current.image

    const _image = this.getImageURL(image)

    return (
      <View style={styles.container}>
        <RNSketchCanvas
          editable={editable}
          ref={ref => (this._refRNSketch = ref)}
          containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
          canvasStyle={{
            backgroundColor: 'transparent',
            flex: 1,
            // marginHorizontal: 20,
          }}
          defaultStrokeIndex={0}
          defaultStrokeWidth={defaultStrokeWidth}
          minStrokeWidth={defaultStrokeWidth}
          maxStrokeWidth={defaultStrokeWidth * 5}
          strokeWidthStep={defaultStrokeWidth}
          localSourceImage={
            _image && {
              filename: _image,
              directory: null,
              mode: 'AspectFit',
            }
          }
          strokeColors={[
            { color: '#000000' },
            { color: '#ff0000' },
            { color: '#ffff00' },
            { color: '#2a00ff' },
            { color: '#ffffff' },
          ]}
          touchEnabled={false}
          strokeWidthComponent={strokeWidth => {
            return (
              <TouchableOpacity
                style={styles.containerIcon}
                onPress={() => this._refActionSheet.show()}
              >
                <Icon name={'camera-retake'} color={'#acacac'} size={28} />
              </TouchableOpacity>
            )
          }}
          // clearComponent={
          //   <View style={styles.containerIcon}>
          //     <Icon name={'trash-can-outline'} color={'#acacac'} size={28} />
          //   </View>
          // }
          undoComponent={
            <View style={styles.containerIcon}>
              <Icon name={'restore'} color={'#acacac'} size={28} />
            </View>
          }
          eraseComponent={
            <View style={styles.containerIcon}>
              <Icon name={'eraser'} color={'#acacac'} size={28} />
            </View>
          }
          strokeComponent={color => (
            <View
              style={[styles.strokeColorButton, { backgroundColor: color }]}
            />
          )}
          strokeSelectedComponent={(color, index, changed) => {
            return (
              <View
                style={[{ backgroundColor: color }, styles.strokeColorButton]}
              >
                <Icon name={'check'} color={getContrast(color)} size={15} />
              </View>
            )
          }}
          savePreference={() => {
            return {
              folder: 'Pipixel',
              includeImage: true,
              filename: String(Math.ceil(Math.random() * 100000000)),
              transparent: false,
              imageType: 'png',
            }
          }}
          touchEnabled={false}
          onSketchSaved={this.onSketchSaved}
        />

        <ActionSheet
          ref={o => (this._refActionSheet = o)}
          title={'Which one do you select?'}
          options={[
            'Open Camera',
            'Open Galery',
            'Use Original Photo',
            'Cancel',
          ]}
          cancelButtonIndex={3}
          // destructiveButtonIndex={1}
          onPress={index => {
            if (index <= 1) {
              this.getImage(index)
            } else if (index === 2) {
              productStore.current.image_markup = productStore.current.image
            }
          }}
        />
      </View>
    )
  }
}

SketchCanvas.propTypes = {}

SketchCanvas.defaultProps = {}

export default SketchCanvas
