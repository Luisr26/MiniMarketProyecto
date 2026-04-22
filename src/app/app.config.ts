import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';

import { provideNzIcons } from 'ng-zorro-antd/icon';
import { 
  UserOutline, LockOutline, EyeOutline, EyeInvisibleOutline, AppstoreOutline,
  ShopOutline, InboxOutline, CarOutline, TeamOutline, BarChartOutline,
  PlusSquareOutline, HistoryOutline, PlusOutline, QuestionCircleOutline,
  SettingOutline, BellOutline, LogoutOutline, DollarOutline, DollarCircleOutline, WarningOutline,
  LineChartOutline, SearchOutline, FilterOutline, MoreOutline, BarcodeOutline,
  WarningFill, DeleteOutline, ShoppingCartOutline, MoneyCollectOutline,
  WalletFill, CheckCircleOutline, PrinterOutline, MailOutline, CreditCardOutline,
  QrcodeOutline, SyncOutline, CloseOutline, ShopFill, RiseOutline,
  InfoCircleOutline, SafetyCertificateOutline, CameraOutline, ClockCircleOutline,
  PlusCircleOutline, DownloadOutline, EditOutline, FrownOutline, PhoneOutline,
  LeftOutline, RightOutline, ControlOutline, StarOutline, ThunderboltOutline,
  ShoppingOutline, CalendarOutline, FileTextOutline, SwapOutline,
  EnvironmentOutline, NumberOutline, ProfileOutline
} from '@ant-design/icons-angular/icons';

const icons = [
  UserOutline, LockOutline, EyeOutline, EyeInvisibleOutline, AppstoreOutline,
  ShopOutline, InboxOutline, CarOutline, TeamOutline, BarChartOutline,
  PlusSquareOutline, HistoryOutline, PlusOutline, QuestionCircleOutline,
  SettingOutline, BellOutline, LogoutOutline, DollarOutline, DollarCircleOutline, WarningOutline,
  LineChartOutline, SearchOutline, FilterOutline, MoreOutline, BarcodeOutline,
  WarningFill, DeleteOutline, ShoppingCartOutline, MoneyCollectOutline,
  WalletFill, CheckCircleOutline, PrinterOutline, MailOutline, CreditCardOutline,
  QrcodeOutline, SyncOutline, CloseOutline, ShopFill, RiseOutline,
  InfoCircleOutline, SafetyCertificateOutline, CameraOutline, ClockCircleOutline,
  PlusCircleOutline, DownloadOutline, EditOutline, FrownOutline, PhoneOutline,
  LeftOutline, RightOutline, ControlOutline, StarOutline, ThunderboltOutline,
  ShoppingOutline, CalendarOutline, FileTextOutline, SwapOutline,
  EnvironmentOutline, NumberOutline, ProfileOutline
];

registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNzI18n(es_ES),
    provideNzIcons(icons),
    provideAnimationsAsync(),
    provideHttpClient(),
  ]
};

