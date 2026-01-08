
import { saveAs } from 'file-saver'; // Need to ensure file-saver is installed or use native anchor

// Diagnosis Types
export interface DiagnosisReport {
    app_name: string;
    app_version: string;
    timestamp: string;
    error_code: string;
    error_category: string;
    error_summary: string;
    component: string;
    severity: 'Info' | 'Warning' | 'Critical';
    os: string;
    user_action: string;
    safe_mode_available: boolean;
    technical_details?: string;
}

export const generateReport = (
    error: Error | string,
    component: string,
    action: string,
    code: string = "GEN_ERR"
): DiagnosisReport => {
    const isError = error instanceof Error;
    const message = isError ? error.message : error as string;
    const stack = isError ? error.stack : '';

    return {
        app_name: "BioDockify Pharma Research",
        app_version: "2.10.0", // Retrieve dynamically if possible
        timestamp: new Date().toISOString(),
        error_code: code,
        error_category: "RUNTIME", // Logic to categorize could go here
        error_summary: message,
        component: component,
        severity: "Warning",
        os: navigator.userAgent, // Approx OS info from browser
        user_action: action,
        safe_mode_available: true,
        technical_details: stack
    };
};

export const downloadReport = (report: DiagnosisReport) => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    // Clean manual download anchor to avoid dependency
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biodockify_diagnostic_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const openEmailClient = (report: DiagnosisReport) => {
    const recipient = "biodockify@hotmail.com";
    const subject = `[BioDockify Error Report] ${report.error_code} – ${report.component}`;

    const body = `Hello BioDockify Support,

An error occurred in the BioDockify Pharma Research software.

Summary:
- Error: ${report.error_summary}
- Component: ${report.component}
- Severity: ${report.severity}

System Information:
- OS: ${report.os.substring(0, 50)}...
- App Version: ${report.app_version}
- Timestamp: ${report.timestamp}

IMPORTANT: The diagnostic report file (JSON) has been downloaded to my computer. 
I have attached it to this email.

User Notes:
[Please describe what you were doing or add extra details here]

Regards`;

    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
};
