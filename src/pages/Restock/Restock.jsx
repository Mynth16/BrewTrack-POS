import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Restock.css';

function Restock() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const authToken = localStorage.getItem('authToken');

  const [ingredients, setIngredients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    description: '',
    editingId: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const authHeaders = (json = true) => {
    const headers = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return headers;
  };

  useEffect(() => {
    loadIngredients();
    if (isManager) loadTemplates();
  }, [isManager]);

  async function loadIngredients() {
    try {
      const res = await fetch('/api/restock/ingredients');
      const data = await res.json();
      const list = (data.ingredients || []).map((i) => ({
        ...i,
        quantityToAdd: 0,
      }));
      setIngredients(list);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load ingredients');
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch('/api/restock/templates', {
        headers: authHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load templates');
      }

      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error(err);
      setTemplates([]);
      setMessage(err.message);
    }
  }

  function setQty(ingredientID, value) {
    setIngredients((prev) =>
      prev.map((it) =>
        it.ingredientID === ingredientID
          ? { ...it, quantityToAdd: value }
          : it
      )
    );
  }

  function clearAll() {
    setIngredients((prev) => prev.map((it) => ({ ...it, quantityToAdd: 0 })));
    setSelectedTemplateId(null);
    setMessage(null);
  }

  function applyTemplate(template) {
    const map = {};
    (template.items || []).forEach((it) => {
      map[it.ingredientID] = Number(it.quantityToAdd);
    });
    setIngredients((prev) =>
      prev.map((it) => ({
        ...it,
        quantityToAdd: map[it.ingredientID] ?? it.quantityToAdd,
      }))
    );
    setSelectedTemplateId(template.templateID);
    setMessage(`Applied template "${template.templateName}"`);
  }

  async function saveTemplate(e) {
    e?.preventDefault();
    setMessage(null);

    const name = templateForm.templateName?.trim();
    if (!name) return setMessage('Template name required');

    const items = ingredients
      .filter((i) => Number(i.quantityToAdd) !== 0)
      .map((i) => ({
        ingredientID: Number(i.ingredientID),
        quantityToAdd: Number(i.quantityToAdd),
      }));

    if (items.length === 0) return setMessage('No quantities to save');

    setLoading(true);
    try {
      const url = templateForm.editingId
        ? `/api/restock/templates/${templateForm.editingId}`
        : '/api/restock/templates';
      const method = templateForm.editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          templateName: name,
          description: templateForm.description,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');

      setMessage(templateForm.editingId ? 'Template updated' : 'Template created');
      setTemplateForm({ templateName: '', description: '', editingId: null });
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function editTemplate(id) {
    setMessage(null);
    try {
      const res = await fetch(`/api/restock/templates/${id}`, {
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load template');

      if (data.template) {
        setTemplateForm({
          templateName: data.template.templateName || '',
          description: data.template.description || '',
          editingId: id,
        });
        applyTemplate(data.template);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/restock/templates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete template');

      setMessage('Template deleted');
      await loadTemplates();
      setTemplateForm({ templateName: '', description: '', editingId: null });
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  }

  async function submitRestock() {
    setMessage(null);

    const items = ingredients
      .filter((i) => Number(i.quantityToAdd) !== 0)
      .map((i) => ({
        ingredientID: Number(i.ingredientID),
        quantityAdded: Number(i.quantityToAdd),
      }));

    if (items.length === 0) return setMessage('No quantities to restock');

    setLoading(true);
    try {
      const res = await fetch('/api/restock/apply', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply restock');

      setMessage('Restock successful');
      clearAll();
      await loadIngredients();
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isManager) {
    return (
      <div className="restock-container">
        <div className="restock-wrapper">
          <h2>Restock</h2>
          <p>Only Managers can perform restock actions.</p>
          <button className="back-button" onClick={() => navigate('/inventory')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="restock-container">
      <div className="restock-wrapper">
        <div className="restock-header">
          <h2>Restock</h2>
          <div className="restock-actions">
            <button onClick={clearAll}>Clear</button>
            <button onClick={submitRestock} disabled={loading}>
              {loading ? 'Processing...' : 'Submit Restock'}
            </button>
            <button onClick={() => navigate('/inventory')}>Back</button>
          </div>
        </div>

        <div className="restock-main">
          <div className="restock-left">
            <table className="restock-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th className = "qty-to-add">Qty to Add</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((it) => (
                  <tr key={it.ingredientID}>
                    <td>{it.ingredientName}</td>
                    <td>{it.stockQuantity}</td>
                    <td>{it.unit || '-'}</td>
                    <td className = "qty-to-add">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.quantityToAdd}
                        onChange={(e) =>
                          setQty(
                            it.ingredientID,
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="restock-sidebar">
            <div className="template-manager">
              <h3>Templates</h3>
              <div className="template-list">
                {templates.map((t) => (
                  <div
                    key={t.templateID}
                    className={`template-row ${
                      selectedTemplateId === t.templateID ? 'selected' : ''
                    }`}
                  >
                    <div className="template-info">
                      <strong>{t.templateName}</strong>
                      <div className="template-meta">
                        {t.description || ''}
                      </div>
                    </div>
                    <div className="template-actions">
                      <button onClick={() => applyTemplate(t)}>Apply</button>
                      <button onClick={() => editTemplate(t.templateID)}>
                        Edit
                      </button>
                      <button onClick={() => deleteTemplate(t.templateID)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="no-templates">No templates yet</div>
                )}
              </div>

              <form className="template-form" onSubmit={saveTemplate}>
                <h4>
                  {templateForm.editingId
                    ? 'Edit Template'
                    : 'Save Current as Template'}
                </h4>
                <input
                  placeholder="Template name"
                  value={templateForm.templateName}
                  onChange={(e) =>
                    setTemplateForm((f) => ({
                      ...f,
                      templateName: e.target.value,
                    }))
                  }
                />
                <textarea
                  placeholder="Description (optional)"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
                <div className="template-form-actions">
                  <button type="submit" disabled={loading}>
                    {templateForm.editingId ? 'Save Changes' : 'Save Template'}
                  </button>
                  {templateForm.editingId && (
                    <button
                      type="button"
                      onClick={() =>
                        setTemplateForm({
                          templateName: '',
                          description: '',
                          editingId: null,
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              {message && <div className="restock-message">{message}</div>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Restock;