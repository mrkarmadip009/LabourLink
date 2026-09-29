import AuthForm from "./AuthForm";
import AuthTabs from "./AuthTabs";

function AuthPanel({ auth }) {
  const { form, feedback, isRegistering, isSubmitting, mode, showPassword } =
    auth;

  return (
    <section className="form-panel">
      <div className="form-wrap">
        <div className="mobile-brand">
          <div className="brand-mark">LL</div>
          <span>LabourLink</span>
        </div>
        <div className="form-heading">
          <p className="eyebrow">Welcome</p>
          <h2>{isRegistering ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isRegistering
              ? "Start finding the right people for the job."
              : "Sign in to pick up where you left off."}
          </p>
        </div>
        <AuthTabs mode={mode} onModeChange={auth.switchMode} />
        <AuthForm
          form={form}
          feedback={feedback}
          isRegistering={isRegistering}
          isSubmitting={isSubmitting}
          showPassword={showPassword}
          onChange={auth.updateField}
          onSubmit={auth.submitForm}
          onTogglePassword={() => auth.setShowPassword((visible) => !visible)}
        />
        <p className="legal-copy">
          By continuing, you agree to LabourLink's terms and privacy policy.
        </p>
      </div>
    </section>
  );
}

export default AuthPanel;
