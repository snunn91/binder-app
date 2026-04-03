import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PokeBinder",
  description: "Privacy Policy for PokeBinder.",
};

const UPDATED_DATE = "February 22, 2026";

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 font-exo text-zinc-700 dark:text-slate-100">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Last updated: {UPDATED_DATE}
      </p>

      <div className="mt-6 space-y-6 text-sm leading-7">
        <p>
          This Privacy Policy explains how PokeBinder (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) collects, uses, shares, and
          protects your information when you use our website and services.
        </p>
        <p>PokeBinder is operated from Ontario, Canada.</p>

        <section>
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="mt-2">
            We may collect the following categories of information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Account information, such as name, email address, and
              authentication identifiers.
            </li>
            <li>
              Binder and collection data you create, upload, or organize in the
              app.
            </li>
            <li>
              Usage data, such as interactions, pages viewed, device/browser
              metadata, and approximate diagnostics.
            </li>
            <li>
              Technical data, such as IP address, timestamps, log data, and
              cookies/local storage identifiers.
            </li>
            <li>
              Communications you send us (support emails, feedback, reports).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide, maintain, and improve the service.</li>
            <li>Authenticate users, secure accounts, and prevent abuse.</li>
            <li>Store and sync your binder data across sessions/devices.</li>
            <li>
              Respond to support requests and communicate service updates.
            </li>
            <li>Comply with legal obligations and enforce our Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            3. Legal Bases (Where Applicable)
          </h2>
          <p className="mt-2">
            Where required by law (including GDPR/UK GDPR), we process personal
            data based on one or more legal bases: performance of a contract,
            legitimate interests, consent, and compliance with legal
            obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            4. Cookies and Similar Technologies
          </h2>
          <p className="mt-2">
            We use cookies and similar technologies for session management,
            authentication, security, and analytics/diagnostics. You can manage
            cookie settings through your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. How We Share Information</h2>
          <p className="mt-2">We may share information with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Service providers and infrastructure vendors that support app
              operations.
            </li>
            <li>
              Authentication providers you use to sign in (for example, Google
              OAuth).
            </li>
            <li>
              Legal authorities where required by law, regulation, or valid
              legal process.
            </li>
            <li>
              Successors in connection with a merger, acquisition, financing, or
              asset sale.
            </li>
          </ul>
          <p className="mt-2">
            We do not sell personal information in exchange for money.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p className="mt-2">
            We retain personal data for as long as needed to provide the
            service, comply with legal obligations, resolve disputes, and
            enforce agreements. Retention periods may vary by data type.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Security</h2>
          <p className="mt-2">
            We use reasonable administrative, technical, and organizational
            safeguards to protect information. No system can guarantee absolute
            security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Your Privacy Rights</h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have rights to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access, correct, or delete certain personal information.</li>
            <li>Receive a copy/portability of your data.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Appeal a denied request, where required by law.</li>
          </ul>
          <p className="mt-2">
            To exercise rights, contact us at:{" "}
            <a
              className="underline"
              href="mailto:sam.nunn91.bulkboxbinder@gmail.com">
              sam.nunn91.bulkboxbinder@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            9. California Privacy Notice
          </h2>
          <p className="mt-2">
            California residents may have rights under California privacy laws,
            including rights to know, delete, correct, and limit use of
            sensitive personal information where applicable. We do not
            discriminate against users for exercising valid privacy rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            10. Canada and Ontario Privacy Notice
          </h2>
          <p className="mt-2">
            For users in Canada, we handle personal information in line with
            applicable Canadian privacy laws, including the Personal Information
            Protection and Electronic Documents Act (PIPEDA), and other
            applicable provincial requirements.
          </p>
          <p className="mt-2">
            Subject to applicable law, Canadian users may request access to
            personal information we hold about them and request correction of
            inaccuracies. We will respond within timelines required by law.
          </p>
          <p className="mt-2">
            If you believe we have not handled your personal information
            appropriately, you may contact us first at{" "}
            <a
              className="underline"
              href="mailto:sam.nunn91.bulkboxbinder@gmail.com">
              sam.nunn91.bulkboxbinder@gmail.com
            </a>
            . You may also have the right to file a complaint with the Office of
            the Privacy Commissioner of Canada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            11. International Data Transfers
          </h2>
          <p className="mt-2">
            If you access the service from outside the country where our systems
            are located, your information may be transferred and processed in
            jurisdictions with different data protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            12. Marketing Communications (Canada CASL)
          </h2>
          <p className="mt-2">
            If we send commercial electronic messages to users in Canada, we do
            so in accordance with applicable anti-spam rules, including CASL.
            Where required, we obtain consent, include sender identification,
            and provide a working unsubscribe mechanism.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">13. Breach Notification</h2>
          <p className="mt-2">
            Where required by applicable law, we will notify affected users and
            regulators of eligible data breaches within required timelines.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">14. Children&apos;s Privacy</h2>
          <p className="mt-2">
            The service is not directed to children under 13 (or higher age
            where required by local law). If you believe a child provided
            personal data, contact us so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            15. Third-Party Links and Content
          </h2>
          <p className="mt-2">
            The service may include links or third-party content. We are not
            responsible for third-party privacy practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">16. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Material
            changes will be posted with an updated &quot;Last updated&quot;
            date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">17. Contact Us</h2>
          <p className="mt-2">
            Privacy questions:{" "}
            <a
              className="underline"
              href="mailto:sam.nunn91.bulkboxbinder@gmail.com">
              sam.nunn91.bulkboxbinder@gmail.com
            </a>
          </p>
          <p>
            General support:{" "}
            <a
              className="underline"
              href="mailto:sam.nunn91.bulkboxbinder@gmail.com">
              sam.nunn91.bulkboxbinder@gmail.com
            </a>
          </p>
          <p>
            Privacy Officer:{" "}
            <a
              className="underline"
              href="mailto:sam.nunn91.bulkboxbinder@gmail.com">
              sam.nunn91.bulkboxbinder@gmail.com
            </a>
          </p>
          <p>Location: Ontario, Canada</p>
        </section>

        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-600/50 dark:bg-amber-900/20 dark:text-amber-200">
          This page is provided for informational purposes and may need to be
          reviewed by qualified legal counsel for your specific business and
          jurisdictions.
        </p>
      </div>
    </section>
  );
}
