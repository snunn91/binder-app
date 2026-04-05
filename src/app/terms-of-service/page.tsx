import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | PokeBinder",
  description: "Terms of Service for PokeBinder.",
};

const UPDATED_DATE = "February 22, 2026";

export default function TermsOfServicePage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 font-exo text-zinc-700 dark:text-slate-100">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Last updated: {UPDATED_DATE}
      </p>

      <div className="mt-6 space-y-6 text-sm leading-7">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of PokeBinder (the &quot;Service&quot;). By using the Service, you
          agree to these Terms.
        </p>
        <p>PokeBinder is operated from Ontario, Canada.</p>

        <section>
          <h2 className="text-xl font-semibold">1. Eligibility and Account</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              You must be at least 13 years old to use the Service. If you are
              between 13 and 17 years of age, you represent that your parent or
              legal guardian has reviewed and agreed to these Terms on your
              behalf. Users 18 and over must have the legal capacity to enter
              into a binding agreement.
            </li>
            <li>
              You are responsible for your account credentials and account
              activity.
            </li>
            <li>You must provide accurate information and keep it current.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Service Description</h2>
          <p className="mt-2">
            PokeBinder provides tools to build and manage digital trading card
            binders. Features may change, be suspended, or be discontinued at
            any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Violate laws or infringe the rights of others.</li>
            <li>
              Attempt unauthorized access, interfere with systems, or bypass
              security.
            </li>
            <li>Upload malicious code, spam, or abusive/illegal content.</li>
            <li>
              Scrape, automate, or reverse engineer beyond what law allows.
            </li>
            <li>
              Misrepresent affiliation with Nintendo, The Pokemon Company, or
              any third party.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. User Content</h2>
          <p className="mt-2">
            You retain ownership of content you submit (for example binder
            names, notes, and organization data). You grant us a non-exclusive,
            worldwide, royalty-free license to host, process, and display your
            content solely to operate and improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
          <p className="mt-2">
            The Service software, branding, and original materials are owned by
            us or our licensors and protected by applicable intellectual
            property laws. No rights are granted except as expressly provided in
            these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            6. Third-Party Services and Data
          </h2>
          <p className="mt-2">
            The Service may depend on third-party providers (authentication,
            hosting, APIs, card data, etc.). We are not responsible for
            third-party outages, policies, or content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            7. Fees and Payments (If Applicable)
          </h2>
          <p className="mt-2">
            If paid features are introduced, pricing and billing terms will be
            provided at purchase. Fees are generally non-refundable unless
            required by law.
          </p>
          <p className="mt-2">
            For Ontario consumers, if an arrangement qualifies as an internet or
            remote agreement under the Consumer Protection Act, 2002, any
            mandatory disclosures, delivery requirements, and cancellation
            rights under that law apply. Nothing in these Terms limits
            non-waivable consumer rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Termination and Account Deletion</h2>
          <p className="mt-2">
            You may stop using the Service at any time. We may suspend or
            terminate access for violation of these Terms, security risk, legal
            requirements, or prolonged inactivity.
          </p>
          <p className="mt-2">
            To request deletion of your account and associated personal data,
            contact us at{" "}
            <a className="underline" href="mailto:bulkboxbinder@gmail.com">
              bulkboxbinder@gmail.com
            </a>
            . We will process your request within 30 days. Note that some
            information may be retained where required by law or legitimate
            business purposes (such as dispute resolution or legal compliance).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Disclaimers</h2>
          <p className="mt-2">
            The Service is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis, without warranties of any kind, express or
            implied, including merchantability, fitness for a particular
            purpose, non-infringement, and uninterrupted availability.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, we are not liable for
            indirect, incidental, special, consequential, exemplary, or punitive
            damages, or for loss of data, profits, goodwill, or business
            interruption. Our aggregate liability is limited to the amount you
            paid us (if any) in the 12 months before the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Indemnification</h2>
          <p className="mt-2">
            You agree to defend, indemnify, and hold harmless us and our
            affiliates from claims arising out of your misuse of the Service,
            your content, or your violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            12. Governing Law and Disputes
          </h2>
          <p className="mt-2">
            These Terms are governed by the laws of the Province of Ontario and
            the federal laws of Canada applicable therein, excluding
            conflict-of-law rules. Disputes will be resolved in the courts of
            Ontario, Canada, unless mandatory law requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">13. Changes to Terms</h2>
          <p className="mt-2">
            We may modify these Terms. Updated Terms will be posted with a new
            effective date. Continued use after changes means you accept the
            revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">14. Contact</h2>
          <p className="mt-2">
            Questions about these Terms:{" "}
            <a className="underline" href="mailto:bulkboxbinder@gmail.com">
              bulkboxbinder@gmail.com
            </a>
          </p>
          <p>Location: Ontario, Canada</p>
        </section>

        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-600/50 dark:bg-amber-900/20 dark:text-amber-200">
          This page is a general terms template and may need review by qualified
          legal counsel based on your jurisdiction, business model, and risk
          profile.
        </p>
      </div>
    </section>
  );
}
