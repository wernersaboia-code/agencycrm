// types/paypal.d.ts
declare module '@paypal/checkout-server-sdk' {
    type PayPalRequestBody = Record<string, unknown>

    type PayPalEnvironment = object

    interface PayPalRequest {
        requestBody?: (body: PayPalRequestBody) => void
    }

    interface PayPalOrderResult {
        id: string
        status?: string
        payer?: {
            payer_id?: string
            email_address?: string
            name?: {
                given_name?: string
                surname?: string
            }
        }
    }

    interface PayPalHttpResponse<T = PayPalOrderResult> {
        result: T
    }

    export namespace core {
        export class PayPalHttpClient {
            constructor(environment: PayPalEnvironment)
            execute<T = PayPalOrderResult>(request: PayPalRequest): Promise<PayPalHttpResponse<T>>
        }

        export class SandboxEnvironment {
            constructor(clientId: string, clientSecret: string)
        }

        export class LiveEnvironment {
            constructor(clientId: string, clientSecret: string)
        }
    }

    export namespace orders {
        export class OrdersCreateRequest implements PayPalRequest {
            prefer(value: string): void
            requestBody(body: PayPalRequestBody): void
        }

        export class OrdersCaptureRequest implements PayPalRequest {
            constructor(orderId: string)
            requestBody(body: PayPalRequestBody): void
        }

        export class OrdersGetRequest {
            constructor(orderId: string)
        }
    }

    export namespace payments {
        export class CapturesRefundRequest implements PayPalRequest {
            constructor(captureId: string)
            requestBody(body: PayPalRequestBody): void
        }
    }
}

declare module '@paypal/react-paypal-js' {
    import { ComponentType, ReactNode } from 'react'

    export interface PayPalScriptProviderProps {
        options: {
            clientId: string
            currency?: string
            intent?: 'capture' | 'authorize'
            vault?: boolean
            commit?: boolean
        }
        children: ReactNode
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
        onError?: (err: Record<string, unknown>) => void
        onCancel?: () => void
    }

    export const PayPalButtons: ComponentType<PayPalButtonsComponentProps>
}
