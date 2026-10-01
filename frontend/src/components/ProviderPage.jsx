import { useCallback, useEffect, useState } from "react";
import AppHeader from "./AppHeader";
import api, { getErrorMessage } from "../services/api";

const blankForm = {
  totalLabours: 1,
  availableLabours: 1,
  male: 0,
  female: 0,
  categoryId: "",
  priceRate: "",
  description: "",
  availabilityStart: "",
  availabilityEnd: "",
};

function ProviderPage({ user, currentPage, onNavigate, onSignOut }) {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [{ data: categoryData }, { data: listingData }] = await Promise.all(
        [
          api.get("/api/labour-availability/categories"),
          api.get("/api/labour-availability/mine"),
        ],
      );
      setCategories(categoryData.categories || []);
      const nextListings = listingData.labourLists || [];
      setListings(nextListings);
      const responses = await Promise.all(
        nextListings.map((listing) =>
          api
            .get(`/api/bookings/listing/${listing._id}`)
            .catch(() => ({ data: { bookings: [] } })),
        ),
      );
      setBookings(
        responses.flatMap((response) => response.data.bookings || []),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not load your provider workspace."),
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const addCategory = async (event) => {
    event.preventDefault();
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;

    setIsAddingCategory(true);
    try {
      const { data } = await api.post("/api/labour-availability/categories", {
        categoryName: trimmedName,
      });
      const createdCategory = data.category;
      setCategories((current) => [...current, createdCategory]);
      setForm((current) => ({ ...current, categoryId: createdCategory._id }));
      setCategoryName("");
      setShowCategoryForm(false);
      setFeedback({ type: "success", text: "Category added and selected." });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not add category."),
      });
    } finally {
      setIsAddingCategory(false);
    }
  };
  const editListing = (listing) => {
    const category = listing.categories?.[0] || {};
    setEditingId(listing._id);
    setForm({
      totalLabours: listing.totalLabours,
      availableLabours: listing.availableLabours,
      male: listing.gender?.male || 0,
      female: listing.gender?.female || 0,
      categoryId: category.categoryId?._id || category.categoryId || "",
      priceRate: category.priceRate || "",
      description: listing.description || "",
      availabilityStart: listing.availabilityStart?.slice(0, 10) || "",
      availabilityEnd: listing.availabilityEnd?.slice(0, 10) || "",
    });
  };
  const saveListing = async (event) => {
    event.preventDefault();
    if (!form.categoryId) {
      setFeedback({ type: "error", text: "Choose a category before publishing the listing." });
      return;
    }
    if (Number(form.availableLabours) > Number(form.totalLabours)) {
      setFeedback({ type: "error", text: "Available workers cannot exceed total workers." });
      return;
    }
    if (Number(form.male) + Number(form.female) > Number(form.availableLabours)) {
      setFeedback({ type: "error", text: "The gender split cannot exceed available workers." });
      return;
    }
    const payload = {
      totalLabours: Number(form.totalLabours),
      availableLabours: Number(form.availableLabours),
      gender: { male: Number(form.male), female: Number(form.female) },
      categories: [
        {
          categoryId: form.categoryId,
          labourCount: Number(form.availableLabours),
          priceRate: Number(form.priceRate),
        },
      ],
      description: form.description,
      availabilityStart: form.availabilityStart || undefined,
      availabilityEnd: form.availabilityEnd || undefined,
      ...(user.location?.coordinates?.length === 2
        ? { location: user.location }
        : {}),
    };
    try {
      if (editingId)
        await api.put(`/api/labour-availability/${editingId}`, payload);
      else await api.post("/api/labour-availability", payload);
      setFeedback({
        type: "success",
        text: editingId
          ? "Listing updated successfully."
          : "Your availability listing is live.",
      });
      setEditingId(null);
      setForm(blankForm);
      loadData();
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not save listing."),
      });
    }
  };
  const deleteListing = async (listingId) => {
    if (!window.confirm("Delete this availability listing?")) return;
    try {
      await api.delete(`/api/labour-availability/${listingId}`);
      setListings((current) =>
        current.filter((listing) => listing._id !== listingId),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not delete listing."),
      });
    }
  };
  const updateBooking = async (bookingId, status) => {
    try {
      const { data } = await api.put(`/api/bookings/${bookingId}/status`, {
        status,
      });
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? data.booking : booking,
        ),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not update booking."),
      });
    }
  };
  const updatePayment = async (bookingId) => {
    try {
      const { data } = await api.put(`/api/bookings/${bookingId}/payment`, {
        paymentStatus: "completed",
      });
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? data.booking : booking,
        ),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Could not update payment."),
      });
    }
  };

  return (
    <main className="app-page">
      <AppHeader {...{ user, currentPage, onNavigate, onSignOut }} />
      <section className="page-intro compact">
        <p className="eyebrow">Provider workspace / 01</p>
        <h1>
          Put your best
          <br />
          <em>work forward.</em>
        </h1>
        <p>
          Publish availability, manage listings, and handle incoming work
          requests.
        </p>
      </section>
      <section className="provider-layout">
        <form className="content-card" onSubmit={saveListing}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {editingId ? "Edit listing" : "Availability"}
              </p>
              <h2>{editingId ? "Update your listing" : "Publish a listing"}</h2>
            </div>
          </div>
          <div className="field-row">
            <label>
              <span>Total workers</span>
              <input
                name="totalLabours"
                type="number"
                min="1"
                value={form.totalLabours}
                onChange={update}
                required
              />
            </label>
            <label>
              <span>Available now</span>
              <input
                name="availableLabours"
                type="number"
                min="1"
                value={form.availableLabours}
                onChange={update}
                required
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              <span>Men</span>
              <input
                name="male"
                type="number"
                min="0"
                value={form.male}
                onChange={update}
                required
              />
            </label>
            <label>
              <span>Women</span>
              <input
                name="female"
                type="number"
                min="0"
                value={form.female}
                onChange={update}
                required
              />
            </label>
          </div>
          <div className="category-field">
            <label>
              <span>Category added to this listing</span>
              <input
                value={categories.find((category) => category._id === form.categoryId)?.categoryName || "Add a category below"}
                readOnly
                required
              />
            </label>
            <button
              className="secondary-button add-category-button"
              type="button"
              onClick={() => setShowCategoryForm((current) => !current)}
            >
              {showCategoryForm ? "Close" : "+ Add category"}
            </button>
          </div>
          {showCategoryForm && (
            <div className="inline-category-form">
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="e.g. Tractor driver"
                aria-label="New category name"
                maxLength="80"
              />
              <button
                className="secondary-button"
                type="button"
                onClick={addCategory}
                disabled={isAddingCategory}
              >
                {isAddingCategory ? "Adding..." : "Add"}
              </button>
            </div>
          )}
          <div className="field-row">
            <label>
              <span>Rate per worker/day</span>
              <input
                name="priceRate"
                type="number"
                min="0"
                value={form.priceRate}
                onChange={update}
                required
              />
            </label>
            <span />
          </div>
          <div className="field-row">
            <label>
              <span>Available from</span>
              <input
                name="availabilityStart"
                type="date"
                value={form.availabilityStart}
                onChange={update}
                required
              />
            </label>
            <label>
              <span>Available until</span>
              <input
                name="availabilityEnd"
                type="date"
                value={form.availabilityEnd}
                onChange={update}
                required
              />
            </label>
          </div>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="4"
              placeholder="What kind of work can your team handle?"
              required
            />
          </label>
          {feedback && (
            <p className={`feedback ${feedback.type}`}>{feedback.text}</p>
          )}
          <div className="form-actions">
            <button className="submit-button" type="submit">
              {editingId ? "Save listing" : "Publish listing"} <span>→</span>
            </button>
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(blankForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your posts</p>
              <h2>Availability listings</h2>
            </div>
          </div>
          {listings.length ? (
            listings.map((listing) => (
              <article className="listing-management" key={listing._id}>
                <div>
                  <strong>
                    {listing.categories?.[0]?.categoryId?.categoryName ||
                      "Labour listing"}
                  </strong>
                  <span>
                    {listing.availableLabours} of {listing.totalLabours} workers
                    · ₹{listing.categories?.[0]?.priceRate || 0}/day
                  </span>
                  <small>{listing.description}</small>
                </div>
                <div className="request-actions">
                  <button type="button" onClick={() => editListing(listing)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteListing(listing._id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="page-message">No availability listings yet.</p>
          )}
          <div className="section-heading request-heading">
            <div>
              <p className="eyebrow">Incoming work</p>
              <h2>Requests</h2>
            </div>
          </div>
          {bookings.length ? (
            bookings.map((booking) => (
              <article className="request-row" key={booking._id}>
                <div>
                  <strong>{booking.description}</strong>
                  <span>
                    {new Date(booking.bookingDate).toLocaleDateString()} · ₹
                    {booking.totalCost}
                  </span>
                </div>
                <span className={`booking-status ${booking.status}`}>
                  {booking.status}
                </span>
                <div className="request-actions">
                  {booking.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateBooking(booking._id, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBooking(booking._id, "rejected")}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {booking.status === "accepted" &&
                    booking.paymentStatus === "pending" && (
                      <button
                        type="button"
                        onClick={() => updatePayment(booking._id)}
                      >
                        Payment received
                      </button>
                    )}
                </div>
              </article>
            ))
          ) : (
            <p className="page-message">No incoming requests yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default ProviderPage;
