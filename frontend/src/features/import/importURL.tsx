/**
 * This component is the URL-based entrypoint for cards into the project editor.
 * The backend returns a list of domains that it claims to know how to talk to,
 * displayed to the user. A freeform text box is exposed and the backend is asked
 * to process the URL when the user hits Submit.
 */

import React, { useCallback, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import { useGetDFCPairsQuery, useGetImportSitesQuery } from "@/app/api";
import { api } from "@/app/api";
import {
  convertLinesIntoSlotProjectMembers,
  processStringAsMultipleLines,
} from "@/common/processing";
import { useAppDispatch, useAppSelector } from "@/common/types";
import { useProjectName } from "@/features/backend/backendSlice";
import { addMembers, selectProjectSize } from "@/features/project/projectSlice";
import { selectFuzzySearch } from "@/features/searchSettings/searchSettingsSlice";
import { setError } from "@/features/toasts/toastsSlice";
import { Spinner } from "@/features/ui/spinner";
import { RightPaddedIcon } from "@/features/ui/styledComponents";

export function ImportURL() {
  const dfcPairsQuery = useGetDFCPairsQuery();
  const importSitesQuery = useGetImportSitesQuery();
  const projectName = useProjectName();
  const fuzzySearch = useAppSelector(selectFuzzySearch);

  const projectSize = useAppSelector(selectProjectSize);
  const dispatch = useAppDispatch();

  const [showURLModal, setShowURLModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const handleCloseURLModal = () => setShowURLModal(false);
  const handleShowURLModal = () => setShowURLModal(true);
  const [URLModalValue, setURLModalValue] = useState<string>("");

  const [triggerFn, queryImportSiteQuery] =
    api.endpoints.queryImportSite.useLazyQuery();

  const handleSubmitURLModal = useCallback(async () => {
    const trimmedURL = URLModalValue.trim();
    if (trimmedURL.length > 0) {
      setLoading(true);
      try {
        const query = await triggerFn(URLModalValue);
        const processedLines = processStringAsMultipleLines(
          query.data ?? "",
          dfcPairsQuery.data ?? {},
          fuzzySearch
        );
        dispatch(
          addMembers({
            members: convertLinesIntoSlotProjectMembers(
              processedLines,
              projectSize
            ),
          })
        );
        handleCloseURLModal();
      } catch (error: any) {
        dispatch(
          setError([
            "url-import-error",
            {
              name: "URL Import Error",
              message: `An unexpected error occurred while processing your decklist: ${error.message}`,
            },
          ])
        );
      } finally {
        setLoading(false);
      }
    }
  }, [
    dispatch,
    URLModalValue,
    dfcPairsQuery.data,
    projectSize,
    triggerFn,
    fuzzySearch,
  ]);

  return (
    <>
      <Dropdown.Item onClick={handleShowURLModal}>
        <RightPaddedIcon bootstrapIconName="link-45deg" /> URL
      </Dropdown.Item>
      <Modal
        show={loading || showURLModal}
        onHide={handleCloseURLModal}
        onExited={() => setURLModalValue("")}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Cards — URL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Paste a link to a card list hosted on one of the below sites (not
          affiliated) to import the list into {projectName}:
          <br />
          {importSitesQuery.data != null ? (
            <ul>
              {importSitesQuery.data.map((importSite) => (
                <li key={`${importSite.name}-row`}>
                  <a
                    key={importSite.name}
                    href={importSite.url}
                    target="_blank"
                  >
                    {importSite.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <br />
              <Spinner />
              <br />
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Control
              type="url"
              required={true}
              placeholder="https://"
              onChange={(event) => setURLModalValue(event.target.value.trim())}
              value={URLModalValue}
              disabled={loading || importSitesQuery.data == null}
              aria-label="import-url"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseURLModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await handleSubmitURLModal();
            }}
            disabled={loading || importSitesQuery.isFetching}
            style={{ width: 4.75 + "em" }}
          >
            {loading ? <Spinner size={1.5} /> : "Submit"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
