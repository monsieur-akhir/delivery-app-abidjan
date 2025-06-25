declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface DateTimePickerEvent {
    type: 'set' | 'dismissed';
    nativeEvent: {
      timestamp?: number;
    };
  }

  export interface DateTimePickerProps extends ViewProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: DateTimePickerEvent, selectedDate?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    timeZoneOffsetInMinutes?: number;
    timeZoneOffsetInSeconds?: number;
    textColor?: string;
    accentColor?: string;
    neutralButtonLabel?: string;
    positiveButtonLabel?: string;
    negativeButtonLabel?: string;
    is24Hour?: boolean;
    minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
    style?: any;
  }

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
} 