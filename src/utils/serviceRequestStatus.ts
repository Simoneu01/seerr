import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { NonFunctionProperties } from '@server/interfaces/api/common';
import type { DownloadingItem } from '@server/lib/downloadtracker';

export const getServiceSlotStatus = (
  request?: NonFunctionProperties<MediaRequest>
): { status?: MediaStatus; downloadItem?: DownloadingItem[] } => {
  if (!request?.isServiceRequest) {
    return {};
  }

  const serviceStatus = request.media.serviceStatuses?.find(
    (ss) => ss.serviceId === request.serverId
  );

  const status =
    serviceStatus && serviceStatus.status !== MediaStatus.UNKNOWN
      ? serviceStatus.status
      : request.status === MediaRequestStatus.COMPLETED
        ? MediaStatus.AVAILABLE
        : request.status === MediaRequestStatus.APPROVED
          ? MediaStatus.PROCESSING
          : MediaStatus.PENDING;

  return { status, downloadItem: serviceStatus?.downloadStatus ?? [] };
};

export const getMediaServiceStatus = (
  media: Media | undefined,
  serviceId: number
): { status: MediaStatus; downloadItem: DownloadingItem[] } => {
  const serviceStatus = media?.serviceStatuses?.find(
    (ss) => ss.serviceId === serviceId
  );

  if (
    serviceStatus &&
    serviceStatus.status !== MediaStatus.UNKNOWN &&
    serviceStatus.status !== MediaStatus.DELETED
  ) {
    return {
      status: serviceStatus.status,
      downloadItem: serviceStatus.downloadStatus ?? [],
    };
  }

  const request = media?.requests?.find(
    (r) =>
      r.isServiceRequest &&
      r.serverId === serviceId &&
      (r.status === MediaRequestStatus.PENDING ||
        r.status === MediaRequestStatus.APPROVED)
  );

  return {
    status: !request
      ? MediaStatus.UNKNOWN
      : request.status === MediaRequestStatus.PENDING
        ? MediaStatus.PENDING
        : MediaStatus.PROCESSING,
    downloadItem: [],
  };
};
