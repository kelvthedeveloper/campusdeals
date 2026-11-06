'use client';

import Swal from 'sweetalert2';
import { isAxiosError } from 'axios';

export const showSuccess = (title: string, text?: string) => {
    Swal.fire({
        icon: 'success',
        title,
        text,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'OK',
        timer: 3000,
        timerProgressBar: true,
    });
};

export const showError = (title: string, text?: string) => {
    Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'OK',
    });
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (!isAxiosError(error)) return fallback;

    if (error.response && error.response.status >= 500) {
        return 'The server could not complete this request. Please try again later.';
    }

    const data: unknown = error.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
        if ('detail' in data && typeof data.detail === 'string') return data.detail;
        return JSON.stringify(data, null, 2);
    }
    return fallback;
};

export const showWarning = (title: string, text?: string) => {
    Swal.fire({
        icon: 'warning',
        title,
        text,
        confirmButtonColor: '#F59E0B',
        confirmButtonText: 'OK',
    });
};

export const showInfo = (title: string, text?: string) => {
    Swal.fire({
        icon: 'info',
        title,
        text,
        confirmButtonColor: '#3B82F6',
        confirmButtonText: 'OK',
    });
};

export const showConfirm = async (
    title: string,
    text: string,
    confirmText: string = 'Yes',
    cancelText: string = 'No'
): Promise<boolean> => {
    const result = await Swal.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
    });
    return result.isConfirmed;
};

export { Swal };
