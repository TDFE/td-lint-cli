module.exports = {
    '#e6f4ff': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-1'
    },
    '#b5dbff': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-2'
    },
    '#8cc4ff': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-3'
    },
    '#63A9FF': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-4'
    },
    '#3B8CFF': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-5'
    },
    '#126BFB': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-6'
    },
    '#044DD4': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@blue-7'
    },
    '#E6FFF4': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-1'
    },
    '#AAFAD9': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-2'
    },
    '#7BEDC2': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-3'
    },
    '#51E0AE': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-4'
    },
    '#2AD49E': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-5'
    },
    '#07C790': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-6'
    },
    '#00A178': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@green-7'
    },
    '#FFFCF0': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-1'
    },
    '#FFF6D9': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-2'
    },
    '#FFEAB0': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-3'
    },
    '#FFDB87': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-4'
    },
    '#FFC95E': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-5'
    },
    '#F7B035': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-6'
    },
    '#D18B21': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@gold-7'
    },
    '#FFF2F0': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-1'
    },
    '#FFEDEB': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-2'
    },
    '#FFC8C2': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-3'
    },
    '#FFA099': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-4'
    },
    '#FC746F': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-5'
    },
    '#EF4444': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-6'
    },
    '#C92E34': {
        attrs: ['color', 'background', 'background-color'],
        variables: '@red-7'
    },
    '#17233D': {
        getvariables: (attr) => {
            if (['color'].includes(attr)) {
                return '@text-color';
            }

            if (['background', 'background-color'].includes(attr)) {
                return '@bg-color-spotilight';
            }

            return '';
        }
    },
    '#FFF': {
        attrs: ['background', 'background-color'],
        variables: '@white'
    },
    '#FFFFFF': {
        attrs: ['background', 'background-color'],
        variables: '@white'
    },
    '#454F64': {
        attrs: ['color'],
        variables: '@text-color-secondary'
    },
    '#8B919E': {
        getvariables: (attr) => {
            if (['color'].includes(attr)) {
                return 'tint(@text-color, 50%)';
            }

            if (['background', 'background-color'].includes(attr)) {
                return 'tint(@bg-color-spotilight, 50%)';
            }

            return '';
        }
    },
    '#BABDC5': {
        attrs: ['color'],
        variables: '@text-color-tertiary'
    },
    '#C9D2DD': {
        attrs: ['border', 'border-color'],
        variables: '@border-color'
    },
    '#E1E6EE': {
        attrs: ['border', 'border-color'],
        variables: '@border-color-secondary'
    },
    '#E9EDF3': {
        attrs: ['background', 'background-color'],
        variables: '@fill-color'
    },
    '#F1F2F5': {
        attrs: ['background', 'background-color'],
        variables: '@fill-color-tertiary'
    },
    '#F8F9FB': {
        attrs: ['background', 'background-color'],
        variables: '@bg-color-quaternary'
    },
    '2px': {
        attrs: ['border-raduis'],
        variables: '@border-radius-xs'
    },
    '4px': {
        getvariables: (attr) => {
            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-xxs';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-xxs';
            }

            if (['border-radius'].includes(attr)) {
                return '@border-radius-sm';
            }

            return '';
        }
    },
    '8px': {
        getvariables: (attr) => {
            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-xs';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-xs';
            }

            if (['border-raduis'].includes(attr)) {
                return '@border-radius-base';
            }

            return '';
        }
    },
    '12px': {
        getvariables: (attr) => {
            if (['font-size'].includes(attr)) {
                return '@font-size-sm';
            }

            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-sm';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-sm';
            }

            return '';
        }
    },
    '14px': {
        attrs: ['font-size'],
        variables: '@font-size-base'
    },
    '16px': {
        getvariables: (attr) => {
            if (['font-size'].includes(attr)) {
                return '@font-size-lg';
            }

            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-base';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-base';
            }

            if (['border-raduis'].includes(attr)) {
                return '@border-radius-lg';
            }

            return '';
        }
    },
    '18px': {
        attrs: ['font-size'],
        variables: '@heading-3-size'
    },
    '20px': {
        getvariables: (attr) => {
            if (['font-size'].includes(attr)) {
                return '@font-size-xl';
            }

            if (['line-height'].includes(attr)) {
                return '@line-height-sm';
            }

            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-md';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-md';
            }

            return '';
        }
    },
    '22px': {
        attrs: ['line-height'],
        variables: '@line-height-base'
    },
    '24px': {
        getvariables: (attr) => {
            if (['font-size'].includes(attr)) {
                return '@heading-2-size';
            }

            if (['line-height'].includes(attr)) {
                return '@line-height-lg';
            }

            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-lg';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-lg';
            }

            return '';
        }
    },
    '26px': {
        attrs: ['line-height'],
        variables: '@heading-3-line-height'
    },
    '28px': {
        attrs: ['line-height'],
        variables: '@line-height-xl'
    },
    '32px': {
        getvariables: (attr) => {
            if (['font-size'].includes(attr)) {
                return '@heading-1-size';
            }

            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-xl';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-xl';
            }

            return '';
        }
    },
    '40px': {
        attrs: ['line-height'],
        variables: '@heading-1-line-height'
    },
    '48px': {
        getvariables: (attr) => {
            if (['margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'margin'].includes(attr)) {
                return '@margin-xxl';
            }

            if (['padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'padding'].includes(attr)) {
                return '@padding-xxl';
            }

            return '';
        }
    },
    '0px 0px 20px 0px rgba(0, 0, 0, 0.05)': {
        attrs: ['box-shadow'],
        variables: '@box-shadow-md'
    },
    '0px 0px 25px 0px rgba(0, 0, 0, 0.1), 0px 0px 5px -5px rgba(0, 0, 0, 0.05)': {
        attrs: ['box-shadow'],
        variables: '@box-shadow-lg'
    }
};
