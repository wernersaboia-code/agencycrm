// types/paypal.d.ts
declare module '@paypal/checkout-server-sdk' {
    export namespace core {
        export class PayPalHttpClient {
            constructor(environment: any)
            execute(request: any): Promise<any>
        }

        export class SandboxEnvironment {
            constructor(clientId: string, clientSecret: string)
        }

        export class LiveEnvironment {
            constructor(clientId: string, clientSecret: string)
        }
    }

    export namespace orders {
        export class OrdersCreateRequest {
            prefer(value: string): void
            requestBody(body: any): void
        }

        export class OrdersCaptureRequest {
            constructor(orderId: string)
            requestBody(body: any): void
        }

        export class OrdersGetRequest {
            constructor(orderId: string)
        }
    }

    export namespace payments {
        export class CapturesRefundRequest {
            constructor(captureId: string)
            requestBody(body: any): void
        }
    }
}

declare module '@paypal/react-paypal-js' {
    import { ComponentType } from 'react'

    export interface PayPalScriptProviderProps {
        options: {
            clientId: string
            currency?: string
            intent?: 'capture' | 'authorize'
            vault?: boolean
            commit?: boolean
        }
        children: React.ReactNode
    }

    export const PayPalScriptProvider: ComponentType<PayPalScriptProviderProps>

    export interface PayPalButtonsComponentProps {
        style?: {
            layout?: 'vertical' | 'horizontal'
            color?: 'gold' | 'blue' | 'silver' | 'white' | 'black'
            shape?: 'rect' | 'pill'
            label?: 'paypal' | 'checkout' | 'buynow' | 'pay'
            height?: number
        }
        createOrder?: () => Promise<string>
        onApprove?: (data: { orderID: string; payerID?: string }) => Promise<void>
        onError?: (err: any) => void
        onCancel?: () => void
    }

    export const PayPalButtons: ComponentType<PayPalButtonsComponentProps>
}